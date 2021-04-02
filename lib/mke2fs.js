'use strict';

async function mke2fs(instance, params) {
	const paramsToC = ['mke2fs', ...params];

	await instance.util.withCStringArray(paramsToC, async function(argv) {
		await instance.util.ccallThrowAsync('node_ext2fs_mke2fs', 'number', ['number', 'number'], [paramsToC.length, argv]);
	});
}

function jsonToOptions(params) {
	let options = [];

	if (params.raw) {
		if (typeof params.raw !== 'object') {
			throw new Error('raw field must be an object');
		}

		Object.keys(params.raw).forEach((key) => {
			options = options.concat([ '-' + key, params.raw[key] ]);
		});
	}

	return options;
}

async function mke2fsWithDisk(instance, disk, params) {
	if (typeof disk.getCapacity !== 'function') {
		throw new Error('disk interface does not provide getCapacity() - cannot determine disk size');
	}

	const size = await disk.getCapacity();
	const sizeAsPowerOfTwoKilobytes = Math.floor(size / 1024);

	const options = jsonToOptions(params || {});

	await instance.util.withDiskId(disk, async function(diskId) {
		await mke2fs(instance, [
			...options,

			// mke2fs has no means to measure disk size, so we need to provide
			// it explicitly. When the block size (-b) parameter is given, the fs_size
			// parameter is treated as number of blocks, so we always pass the size in
			// power-of-two kilobytes with a 'k' postfix, so it will always refer to
			// actual size
			diskId.toString(),
			sizeAsPowerOfTwoKilobytes + 'k'
		]);
	});
}
exports.mke2fsWithDisk = mke2fsWithDisk;
