function create(size) {
	const storage = Buffer.alloc(size);

	function read(buffer, bufferOffset, length, fileOffset) {
		if ((buffer.length - bufferOffset) < length) {
			throw new Error('given buffer too small');
		} else if ((fileOffset + length) > storage.length) {
			throw new Error('read out of bounds');
		}

		storage.copy(buffer, bufferOffset, fileOffset, fileOffset + length);

		return Promise.resolve();
	}

	function write(buffer, bufferOffset, length, fileOffset) {
		if ((buffer.length - bufferOffset) < length) {
			throw new Error('given buffer too small');
		} else if ((fileOffset + length) > storage.length) {
			throw new Error('write out of bounds');
		}

		buffer.copy(storage, fileOffset, bufferOffset, bufferOffset + length);

		return Promise.resolve();
	}

	function discard(offset, length) {
		return write(Buffer.alloc(length), 0, length, offset);
	}

	function flush() {
		// noop
		return Promise.resolve();
	}

	function getCapacity() {
		return Promise.resolve(size);
	}

	return {
		read,
		write,
		discard,
		flush,
		getCapacity
	};
}
exports.create = create;
