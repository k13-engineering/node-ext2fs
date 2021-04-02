#include <stdio.h>
#include <errno.h>

FILE* popen(const char *command, const char *type) {
    errno = ENOSYS;
    return NULL;
}
