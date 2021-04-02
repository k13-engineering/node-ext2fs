V =
ifeq ($(strip $(V)),)
    E = @echo
    Q = @
else
    E = @echo
    Q =
endif

srcdir=deps/e2fsprogs/
libext2fsdir=$(srcdir)lib/ext2fs/
glue=src/glue
mke2fs=$(srcdir)misc/mke2fs

CC = emcc
CFLAGS = -DHAVE_CONFIG_H \
	   -I$(srcdir)/lib \
	   -Iconfig/common \
	   -Iconfig/common/support \
	   -Iconfig/emscripten \
	   -Isrc/shim/include \
	   -O3 \
	   -D ROOT_SYSCONFDIR="\"/etc\"" \
	   -include src/shim/mkfs_shim.h

# As of emscripten 2.0.14, NODEJS_CATCH_EXIT=1 or NODEJS_CATCH_REJECTION=1
# cause a memory leak when instanting multiple times as they register NodeJS
# handlers (see https://github.com/emscripten-core/emscripten/issues/12740)
# Therefore we disable those features
JSFLAGS = \
	-s ASYNCIFY \
	-s ASYNCIFY_IMPORTS="['blk_read', 'blk_write', 'discard', 'flush']" \
	-s EXPORTED_FUNCTIONS="['_malloc_from_js', '_free_from_js', '_node_ext2fs_mount', '_node_ext2fs_trim', '_node_ext2fs_readdir', '_node_ext2fs_open', '_node_ext2fs_read', '_node_ext2fs_write', '_node_ext2fs_unlink', '_node_ext2fs_chmod', '_node_ext2fs_chown', '_node_ext2fs_mkdir', '_node_ext2fs_readlink', '_node_ext2fs_symlink', '_node_ext2fs_close', '_node_ext2fs_umount', '_node_ext2fs_stat_i_mode', '_node_ext2fs_stat_i_links_count', '_node_ext2fs_stat_i_uid', '_node_ext2fs_stat_i_gid', '_node_ext2fs_stat_blocksize', '_node_ext2fs_stat_ino', '_node_ext2fs_stat_i_size', '_node_ext2fs_stat_i_blocks', '_node_ext2fs_stat_i_atime', '_node_ext2fs_stat_i_mtime', '_node_ext2fs_stat_i_ctime', '_node_ext2fs_override_unix_io_manager', '_node_ext2fs_mke2fs']" \
	-s EXPORTED_RUNTIME_METHODS="['ccall', 'FS']" \
	-s MODULARIZE \
	-s NODEJS_CATCH_EXIT=0 -s NODEJS_CATCH_REJECTION=0

OBJS= \
	$(libext2fsdir)alloc.o \
	$(libext2fsdir)alloc_sb.o \
	$(libext2fsdir)alloc_stats.o \
	$(libext2fsdir)alloc_tables.o \
	$(libext2fsdir)atexit.o \
	$(libext2fsdir)badblocks.o \
	$(libext2fsdir)bb_inode.o \
	$(libext2fsdir)bitmaps.o \
	$(libext2fsdir)bitops.o \
	$(libext2fsdir)blkmap64_ba.o \
	$(libext2fsdir)blkmap64_rb.o \
	$(libext2fsdir)blknum.o \
	$(libext2fsdir)block.o \
	$(libext2fsdir)bmap.o \
	$(libext2fsdir)check_desc.o \
	$(libext2fsdir)closefs.o \
	$(libext2fsdir)crc16.o \
	$(libext2fsdir)crc32c.o \
	$(libext2fsdir)csum.o \
	$(libext2fsdir)dblist.o \
	$(libext2fsdir)dblist_dir.o \
	$(libext2fsdir)dir_iterate.o \
	$(libext2fsdir)dirblock.o \
	$(libext2fsdir)dirhash.o \
	$(libext2fsdir)expanddir.o \
	$(libext2fsdir)ext_attr.o \
	$(libext2fsdir)extent.o \
	$(libext2fsdir)fallocate.o \
	$(libext2fsdir)fileio.o \
	$(libext2fsdir)finddev.o \
	$(libext2fsdir)flushb.o \
	$(libext2fsdir)freefs.o \
	$(libext2fsdir)gen_bitmap.o \
	$(libext2fsdir)gen_bitmap64.o \
	$(libext2fsdir)get_num_dirs.o \
	$(libext2fsdir)get_pathname.o \
	$(libext2fsdir)getsectsize.o \
	$(libext2fsdir)getsize.o \
	$(libext2fsdir)i_block.o \
	$(libext2fsdir)icount.o \
	$(libext2fsdir)ind_block.o \
	$(libext2fsdir)initialize.o \
	$(libext2fsdir)inline.o \
	$(libext2fsdir)inline_data.o \
	$(libext2fsdir)inode.o \
	$(libext2fsdir)io_manager.o \
	$(libext2fsdir)ismounted.o \
	$(libext2fsdir)link.o \
	$(libext2fsdir)llseek.o \
	$(libext2fsdir)lookup.o \
	$(libext2fsdir)mkdir.o \
	$(libext2fsdir)mkjournal.o \
	$(libext2fsdir)mmp.o \
	$(libext2fsdir)namei.o \
	$(libext2fsdir)native.o \
	$(libext2fsdir)newdir.o \
	$(libext2fsdir)openfs.o \
	$(libext2fsdir)progress.o \
	$(libext2fsdir)punch.o \
	$(libext2fsdir)rbtree.o \
	$(libext2fsdir)read_bb.o \
	$(libext2fsdir)read_bb_file.o \
	$(libext2fsdir)res_gdt.o \
	$(libext2fsdir)rw_bitmaps.o \
	$(libext2fsdir)sha512.o \
	$(libext2fsdir)swapfs.o \
	$(libext2fsdir)symlink.o \
	$(libext2fsdir)unlink.o \
	$(libext2fsdir)valid_blk.o \
	$(libext2fsdir)version.o \
	$(libext2fsdir)undo_io.o \
	$(libext2fsdir)unix_io.o \
	$(libext2fsdir)../et/error_message.o \
	$(libext2fsdir)../et/et_name.o \
	$(libext2fsdir)../et/init_et.o \
	$(libext2fsdir)../et/com_err.o \
	$(libext2fsdir)../et/com_right.o \
	$(libext2fsdir)../e2p/parse_num.o \
	$(libext2fsdir)../e2p/feature.o \
	$(libext2fsdir)../e2p/mntopts.o \
	$(libext2fsdir)../e2p/uuid.o \
	$(libext2fsdir)../e2p/hashstr.o \
	$(libext2fsdir)../e2p/ostype.o \
	$(libext2fsdir)../support/parse_qtype.o \
	$(libext2fsdir)../support/mkquota.o \
	$(libext2fsdir)../support/quotaio.o \
	$(libext2fsdir)../support/dict.o \
	$(libext2fsdir)../support/profile.o \
	$(libext2fsdir)../support/plausible.o \
	$(libext2fsdir)../../misc/create_inode.o \
	$(libext2fsdir)../../misc/mk_hugefiles.o \
	$(libext2fsdir)../../misc/util.o \
	$(mke2fs).o \
	src/shim/ioctl.o \
	src/shim/popen.o \
	src/shim/exit.o

all: lib/libext2fs.js

%.o: %.c
	$(E) "	CC $<"
	$(Q) $(CC) $(CFLAGS) -c $< -o $@

# We rename the main symbol of mke2fs by defining main to the symbol name we want
$(mke2fs).o: $(mke2fs).c
	$(E) "	CC $<"
	$(Q) $(CC) $(CFLAGS) -D main="node_ext2fs_mke2fs" -c $< -o $@

$(glue).o: $(glue).c $(glue).h
	$(E) "	CC $<"
	$(Q) $(CC) $(CFLAGS) -c $< -o $@

lib/libext2fs.js: $(OBJS) $(glue).o
	$(E) "	JSGEN $@"
	$(Q) $(CC) $(CFLAGS) $(JSFLAGS) $(OBJS) $(glue).o -o $@

clean:
	rm -f $(OBJS) $(glue).o lib/libext2fs.js lib/libext2fs.wasm
