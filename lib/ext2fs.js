'use strict';

const libext2fs = require('./libext2fs');
const utilFactory = require('./util');

async function create({ stdout, stderr } = {}) {
	const objects = new Map();

	let nextId = 0;
	const idPool = [];

	function reserveId() {
		if (idPool.length === 0) {
			nextId += 1;
			idPool.push(nextId);
		}
		return idPool.shift();
	}

	function releaseId(id) {
		idPool.push(id);
	}

	function setObject(obj) {
		const id = reserveId();
		objects.set(id, obj);
		return id;
	}

	function getObject(id) {
		return objects.get(id);
	}

	function deleteObject(id) {
		objects.delete(id);
		releaseId(id);
	}

	async function withObjectId(obj, fn) {
		const id = setObject(obj);
		try {
			return await fn(id);
		} finally {
			deleteObject(id);
		}
	}

	// Returns a js Buffer of the memory at `pointer`.
	function getBuffer(pointer, length) {
		return Buffer.from(this.HEAP8.buffer, pointer, length);
	}

	function preRun(Module) {
		const FS = Module.FS;

		FS.mkdir('/etc');
		FS.writeFile('/etc/mke2fs.conf', `
			[defaults]
				base_features = sparse_super,large_file,filetype,resize_inode,dir_index,ext_attr
				default_mntopts = acl,user_xattr
				enable_periodic_fsck = 0
				blocksize = 4096
				inode_size = 256
				inode_ratio = 16384
		
			[fs_types]
				ext3 = {
					features = has_journal
				}
				ext4 = {
					features = has_journal,extent,huge_file,flex_bg,metadata_csum,64bit,dir_nlink,extra_isize
					inode_size = 256
				}
				small = {
					blocksize = 1024
					inode_size = 128
					inode_ratio = 4096
				}
				floppy = {
					blocksize = 1024
					inode_size = 128
					inode_ratio = 8192
				}
				big = {
					inode_ratio = 32768
				}
				huge = {
					inode_ratio = 65536
				}
				news = {
					inode_ratio = 4096
				}
				largefile = {
					inode_ratio = 1048576
					blocksize = -1
				}
				largefile4 = {
					inode_ratio = 4194304
					blocksize = -1
				}
				hurd = {
					blocksize = 4096
					inode_size = 128
				}
		`);

		function dummyHandler() {
			return null;
		}

		function stdoutHandler(data) {
			const str = String.fromCharCode(data);
			stdout.write(str);
		}

		function stderrHandler(data) {
			const str = String.fromCharCode(data);
			stderr.write(str);
		}

		FS.init(
			dummyHandler,
			stdout ? stdoutHandler : dummyHandler,
			stderr ? stderrHandler : dummyHandler
		);
	}

	const wasm = await libext2fs({
		setObject,
		getObject,
		deleteObject,

		withObjectId,

		getBuffer,

		preRun,

		EIO: 29
	});

	const util = utilFactory.create(wasm);
	util.ccallThrow('node_ext2fs_override_unix_io_manager', 'number', [], []);

	return {
		wasm,
		util
	};
}
exports.create = create;
