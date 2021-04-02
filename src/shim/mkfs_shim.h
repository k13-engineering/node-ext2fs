static void uuid_generate_time(unsigned char uuid[16]) {
    int i;

    for(i = 0; i < 16; i += 1)
    {
        uuid[i] = 0;
    }
}

// We need to override the definition of ioctl because as of
// emscripten 2.0.14 if unknown ioctl()'s are performed, the
// application crashed. There we filter these codes and
// return EINVAL instead of calling abort()
#define ioctl __overriden_ioctl

// We need to override the exit function, so we can throw an
// exception in this case rather than exiting the application.
#define exit __overriden_exit