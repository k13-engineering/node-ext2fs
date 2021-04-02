#ifdef ioctl
    #undef ioctl
#endif

#include <errno.h>
#include <stdarg.h>
#include <sys/ioctl.h>

#define BLKROGET 4702

int __overriden_ioctl(int fd, int req, ...) {
    if(req == BLKROGET) {
        errno = EINVAL;
        return -1;
    }

    va_list args;
    va_start(args, req);
    int r = ioctl(fd, req, args);
    va_end(args);
    return r;
}
