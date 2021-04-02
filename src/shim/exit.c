#ifdef exit
    #undef exit
#endif

#include <emscripten.h>

void __overriden_exit(int code) {
    EM_ASM({
        throw new Error("exit called (code " + $0 + ")");
    }, code);
}
