'use strict';

const { DiskWrapper } = require('./disk');
const createFs = require('./fs');
const ext2fs = require('./ext2fs');
const { mke2fsWithDisk } = require('./mke2fs.js');

exports.mke2fs = async function(disk, options, { stdout, stderr } = {}) {
	const instance = await ext2fs.create({ stdout, stderr });
	await mke2fsWithDisk(instance, disk, options);
};

exports.mount = async function(disk, offset = 0) {
	const instance = await ext2fs.create();

	const wrapper = new DiskWrapper(disk, offset);
	const diskId = instance.wasm.setObject(wrapper);
	let fsPointer;
	try {
		fsPointer = await instance.util.ccallThrowAsync('node_ext2fs_mount', 'number', ['number'], [diskId]);
	} catch (error) {
		instance.wasm.deleteObject(diskId);
		throw error;
	}
	const fs = createFs(instance, fsPointer);
	fs.trim = async () => {
		await instance.util.ccallThrowAsync('node_ext2fs_trim', 'number', ['number'], [fsPointer]);
	};
	fs.diskId = diskId;
	fs._instance = instance;
	return fs;
};

exports.umount = async function(fs) {
	await fs.closeAllFileDescriptors();
	await fs._instance.util.ccallThrowAsync('node_ext2fs_umount', 'number', ['number'], [fs.fsPointer]);
	fs._instance.wasm.deleteObject(fs.diskId);
};

exports.withMountedDisk = async function(disk, offset, fn) {
	const fs = await exports.mount(disk, offset);
	try {
		return await fn(fs);
	} finally {
		await exports.umount(fs);
	}
};
