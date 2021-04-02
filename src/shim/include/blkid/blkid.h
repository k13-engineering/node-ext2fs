#ifndef _BLKID_BLKID_H
#define _BLKID_BLKID_H

typedef struct {} *blkid_cache;

static int blkid_get_cache(blkid_cache* opaque, const char* filename) {
    return -1;
}

static void blkid_put_cache(blkid_cache opaque) {
}

static char * blkid_get_devname (blkid_cache cache, const char *token, const char *value) {
    return "";
}

static char * blkid_get_tag_value (blkid_cache cache, const char *tagname, const char *devname) {
    return "";
}

#endif
