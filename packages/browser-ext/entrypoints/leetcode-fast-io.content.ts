import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
  matches: ['*://*.leetcode.com/*'],
  world: 'MAIN',
  runAt: 'document_start',
  main() {
    const originalFetch = window.fetch;
    
    const C_PLUS_PLUS_BOILERPLATE = `\n#pragma GCC optimize("Ofast")\nconst size_t BUFFER_SIZE = 0x6fafffff; alignas(std::max_align_t) char\nbuffer[BUFFER_SIZE]; size_t buffer_pos = 0; void* operator new(size_t size) {\nconstexpr std::size_t alignment = alignof(std::max_align_t); size_t padding =\n(alignment - (buffer_pos % alignment)) % alignment; size_t total_size = size +\npadding; char* aligned_ptr = &buffer[buffer_pos + padding]; buffer_pos +=\ntotal_size; return aligned_ptr; } void operator delete(void* ptr, unsigned long)\n{} void operator delete(void* ptr) {} void operator delete[](void* ptr) {}`;

    window.fetch = async function (...args) {
      const [resource, config] = args;
      
      if (typeof resource === 'string' && (resource.includes('/submit/') || resource.includes('/interpret_solution/')) && config && config.body) {
        if (document.documentElement.dataset.cpbuddyFastIo === 'true') {
          try {
            const bodyStr = typeof config.body === 'string' ? config.body : new TextDecoder().decode(config.body as any);
            const parsed = JSON.parse(bodyStr);
            
            if (parsed.lang === 'cpp' && parsed.typed_code) {
              parsed.typed_code += C_PLUS_PLUS_BOILERPLATE;
              config.body = JSON.stringify(parsed);
            }
          } catch (e) {
            console.error("CPBuddy Fast I/O inject error:", e);
          }
        }
      }
      
      return originalFetch.apply(this, args);
    };
  }
});
