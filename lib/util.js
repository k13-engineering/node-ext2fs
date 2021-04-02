'use strict';

const { ERRNO_TO_CODE } = require('./wasi');
const queue = require('./queue');
const { DiskWrapper } = require('./disk');

function create(instance) {
	async function promiseToCallback(promise, callback) {
		try {
			const result = await promise;
			callback(null, result);
		} catch (error) {
			callback(error);
		}
	}
	
	function ccallThrow(name, returnType, argsType, args) {
		const result = instance.ccall(name, returnType, argsType, args);
		if (result < 0) {
			throw new ErrnoException(-result, name, args);
		}
		return result;
	}
	
	async function ccallThrowAsync(name, returnType, argsType, args) {
		const result = await queue.addOperation(instance.ccall, [name, returnType, argsType, args, { async: true }]);
		if (result < 0) {
			throw new ErrnoException(-result, name, args);
		}
		return result;
	}
	
	function malloc(length) {
		return ccallThrow('malloc_from_js', 'number', ['number'], [length]);
	}
	
	function strdup(str) {
		const buf = Buffer.from(str);
	
		const length = buf.length + 1;
	
		const heapBufferPointer = malloc(length);
		const heapBuffer = instance.getBuffer(heapBufferPointer, length);
		
		buf.copy(heapBuffer);
		heapBuffer[length - 1] = 0;
	
		return heapBufferPointer;
	}
	
	function free(heapBufferPointer) {
		ccallThrow('free_from_js', 'void', ['number'], [heapBufferPointer]);
	}
	
	async function withHeapBuffer(length, fn) {
		const heapBufferPointer = malloc(length);
		const heapBuffer = instance.getBuffer(heapBufferPointer, length);
		try {
			return await fn(heapBuffer, heapBufferPointer);
		} finally {
			free(heapBufferPointer);
		}
	}
	
	function rstripSlashesBuffer(buf) {
		while (buf[buf.length - 1] === 0x2f) {
			buf = buf.slice(0, buf.length - 1);
		}
		return buf;
	}
	
	async function withPathAsHeapBuffer(path, fn) {
		// path is a string or a Buffer
		// Strips trailing slashes and converts path to a NULL terminated char* readable from C
		if (!Buffer.isBuffer(path)) {
			path = Buffer.from(path);
		}
		path = rstripSlashesBuffer(path);
		const length = path.length + 1;
		return await withHeapBuffer(length, async (heapBuffer, heapBufferPointer) => {
			heapBuffer[length - 1] = 0;
			path.copy(heapBuffer);
			return await fn(heapBufferPointer);
		});
	}
	
	async function withPointerArray(count, fn) {
		const WASM32_POINTER_SIZE = 4;
	
		const arrHeapPointer = malloc(WASM32_POINTER_SIZE * count);
		const arr = instance.HEAP32.subarray(arrHeapPointer >> 2);
	
		try {
			return await fn(arr, arrHeapPointer);
		} finally {
			free(arrHeapPointer);
		}
	}
	
	async function withCStringArray(arr, fn) {
		return await withPointerArray(arr.length, async function(pointerArray, pointerArrayHeapPointer) {
			let cStrings = [];
	
			try {
				arr.forEach((str, idx) => {
					const cString = strdup(str);
					cStrings = cStrings.concat([ cString ]);
					pointerArray[idx] = cString;
				});
	
				return await fn(pointerArrayHeapPointer);
			} finally {
				cStrings.forEach((cString) => {
					free(cString);
				});
			}
		});
	}

	async function withDiskId(disk, fn) {
		const wrapper = new DiskWrapper(disk, 0);
		const diskId = instance.setObject(wrapper);
		try {
			return await fn(diskId);
		} finally {
			instance.deleteObject(diskId);
		}
	}

	return {
		promiseToCallback,
		ccallThrow,
		ccallThrowAsync,

		withHeapBuffer,
		withPathAsHeapBuffer,
		withPointerArray,
		withCStringArray,

		withDiskId
	};
}
exports.create = create;


class ErrnoException extends Error {
	constructor(errno, syscall, args) {
		const code = ERRNO_TO_CODE[errno] || 'UNKNOWN';
		super(`${syscall} ${code} (${errno}) args: ${JSON.stringify(args)}`);
		this.name = 'ErrnoException';
		this.errno = errno;
		this.syscall = syscall;
		this.code = code;
	}
}
exports.ErrnoException = ErrnoException;