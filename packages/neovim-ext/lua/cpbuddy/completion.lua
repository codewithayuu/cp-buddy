local M = {}
local snippets_module = require("cpbuddy.snippets")

-- CP Snippet Trigger Maps
M.snippets_map = {
    dsu = {
        word = "dsu",
        menu = "⚡ [Snippet] Disjoint Set Union",
        info = "DSU with path compression and union by size",
        kind = "Snippet",
        code = [==[struct DSU {
    int n;
    vector<int> parent, sz;
    DSU(int n) : n(n), parent(n), sz(n, 1) {
        iota(parent.begin(), parent.end(), 0);
    }
    int find(int x) {
        return parent[x] == x ? x : (parent[x] = find(parent[x]));
    }
    bool unite(int x, int y) {
        int root_x = find(x), root_y = find(y);
        if (root_x == root_y) return false;
        if (sz[root_x] < sz[root_y]) swap(root_x, root_y);
        parent[root_y] = root_x;
        sz[root_x] += sz[root_y];
        return true;
    }
    bool same(int x, int y) { return find(x) == find(y); }
    int size(int x) { return sz[find(x)]; }
};]==],
    },
    segtree = {
        word = "segtree",
        menu = "⚡ [Snippet] Iterative Segment Tree",
        info = "Point update, range query associative segtree",
        kind = "Snippet",
        code = [==[template <typename T = long long>
struct SegTree {
    int n;
    vector<T> tree;
    T identity;
    function<T(T, T)> merge;
    SegTree(int n, T identity, function<T(T, T)> merge)
        : n(n), identity(identity), merge(merge), tree(2 * n, identity) {}
    void update(int pos, T val) {
        for (tree[pos += n] = val; pos > 1; pos >>= 1)
            tree[pos >> 1] = merge(tree[pos], tree[pos ^ 1]);
    }
    T query(int l, int r) {
        T res_l = identity, res_r = identity;
        for (l += n, r += n + 1; l < r; l >>= 1, r >>= 1) {
            if (l & 1) res_l = merge(res_l, tree[l++]);
            if (r & 1) res_r = merge(tree[--r], res_r);
        }
        return merge(res_l, res_r);
    }
};]==],
    },
    fenwick = {
        word = "fenwick",
        menu = "⚡ [Snippet] 1D Binary Indexed Tree",
        info = "Fenwick tree for point update & prefix sum",
        kind = "Snippet",
        code = [==[template <typename T = long long>
struct Fenwick {
    int n;
    vector<T> tree;
    Fenwick(int n) : n(n), tree(n + 1, 0) {}
    void add(int i, T delta) {
        for (; i <= n; i += i & -i) tree[i] += delta;
    }
    T query(int i) {
        T sum = 0;
        for (; i > 0; i -= i & -i) sum += tree[i];
        return sum;
    }
    T range_query(int l, int r) {
        return (l > r) ? 0 : query(r) - query(l - 1);
    }
};]==],
    },
    dijkstra = {
        word = "dijkstra",
        menu = "⚡ [Snippet] Dijkstra Shortest Path",
        info = "O((V + E) log V) single source shortest paths",
        kind = "Snippet",
        code = [==[vector<long long> dijkstra(int start, int n, const vector<vector<pair<int, long long>>>& adj) {
    const long long INF = 1e18;
    vector<long long> dist(n + 1, INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;
    dist[start] = 0;
    pq.push({0, start});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto& [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}]==],
    },
    sieve = {
        word = "sieve",
        menu = "⚡ [Snippet] Sieve of Eratosthenes",
        info = "Generates primes & smallest prime factor (SPF) up to N",
        kind = "Snippet",
        code = [==[vector<int> primes, spf;
void sieve(int n) {
    spf.assign(n + 1, 0);
    for (int i = 2; i <= n; i++) {
        if (spf[i] == 0) { spf[i] = i; primes.push_back(i); }
        for (int p : primes) {
            if (p > spf[i] || i * p > n) break;
            spf[i * p] = p;
        }
    }
}]==],
    },
    binpow = {
        word = "binpow",
        menu = "⚡ [Snippet] Binary Exponentiation",
        info = "Computes (a^b) % m in O(log b)",
        kind = "Snippet",
        code = [==[long long binpow(long long a, long long b, long long m = 1e9 + 7) {
    long long res = 1;
    a %= m;
    while (b > 0) {
        if (b & 1) res = (res * a) % m;
        a = (a * a) % m;
        b >>= 1;
    }
    return res;
}]==],
    },
    modint = {
        word = "modint",
        menu = "⚡ [Snippet] Modular Arithmetic Struct",
        info = "Auto-mod arithmetic structure for CP",
        kind = "Snippet",
        code = [==[template <int MOD = 1000000007>
struct Modular {
    int v;
    Modular(long long _v = 0) { v = int((_v % MOD + MOD) % MOD); }
    Modular operator+(const Modular& o) const { return Modular(v + o.v); }
    Modular operator-(const Modular& o) const { return Modular(v - o.v); }
    Modular operator*(const Modular& o) const { return Modular(1LL * v * o.v); }
    Modular pow(long long p) const {
        Modular res = 1, a = *this;
        while (p) { if (p & 1) res = res * a; a = a * a; p >>= 1; }
        return res;
    }
    Modular inv() const { return pow(MOD - 2); }
    Modular operator/(const Modular& o) const { return *this * o.inv(); }
    friend ostream& operator<<(ostream& os, const Modular& m) { return os << m.v; }
};
using mint = Modular<1000000007>;]==],
    },
    fastio = {
        word = "fastio",
        menu = "⚡ [Snippet] Fast I/O Setup",
        info = "Disables C++ standard stream synchronization",
        kind = "Snippet",
        code = "ios_base::sync_with_stdio(false); cin.tie(NULL);",
    },
    rep = {
        word = "rep",
        menu = "⚡ [Snippet] for (int i = 0; i < n; i++)",
        info = "Standard 0 to n loop",
        kind = "Snippet",
        code = "for (int i = 0; i < n; i++) {\n    \n}",
    },
    rrep = {
        word = "rrep",
        menu = "⚡ [Snippet] for (int i = n - 1; i >= 0; i--)",
        info = "Reverse loop",
        kind = "Snippet",
        code = "for (int i = n - 1; i >= 0; i--) {\n    \n}",
    },
    yes = {
        word = "yes",
        menu = "⚡ [Snippet] cout << \"YES\\n\"",
        info = "Output YES",
        kind = "Snippet",
        code = "cout << \"YES\\n\";",
    },
    no = {
        word = "no",
        menu = "⚡ [Snippet] cout << \"NO\\n\"",
        info = "Output NO",
        kind = "Snippet",
        code = "cout << \"NO\\n\";",
    },
    dbg = {
        word = "dbg",
        menu = "⚡ [Snippet] Debug Macro",
        info = "cerr debug printer",
        kind = "Snippet",
        code = "#define dbg(x) cerr << #x << \" = \" << (x) << endl;",
    },
    all = {
        word = "all",
        menu = "⚡ [Snippet] v.begin(), v.end()",
        info = "Range iterator helper",
        kind = "Snippet",
        code = "v.begin(), v.end()",
    },
    pb = {
        word = "pb",
        menu = "⚡ [Snippet] push_back",
        info = "vector push_back",
        kind = "Snippet",
        code = "push_back",
    },
    eb = {
        word = "eb",
        menu = "⚡ [Snippet] emplace_back",
        info = "vector emplace_back",
        kind = "Snippet",
        code = "emplace_back",
    },
}

-- Load all Sublime Text imported CP Snippets
local has_sublime, sub_snips = pcall(require, "cpbuddy.sublime_snippets")
if has_sublime and sub_snips and sub_snips.snippets then
    for trigger, item in pairs(sub_snips.snippets) do
        M.snippets_map[trigger] = item
    end
end

-- Standard CP / C++ Keywords & STL methods
M.common_keywords = {
    { word = "vector", menu = " [Type] std::vector<T>", kind = "Class" },
    { word = "priority_queue", menu = " [Type] std::priority_queue<T>", kind = "Class" },
    { word = "unordered_map", menu = " [Type] std::unordered_map<K, V>", kind = "Class" },
    { word = "unordered_set", menu = " [Type] std::unordered_set<T>", kind = "Class" },
    { word = "map", menu = " [Type] std::map<K, V>", kind = "Class" },
    { word = "set", menu = " [Type] std::set<T>", kind = "Class" },
    { word = "multiset", menu = " [Type] std::multiset<T>", kind = "Class" },
    { word = "deque", menu = " [Type] std::deque<T>", kind = "Class" },
    { word = "pair", menu = " [Type] std::pair<T1, T2>", kind = "Class" },
    { word = "tuple", menu = " [Type] std::tuple<...>", kind = "Class" },
    { word = "string", menu = " [Type] std::string", kind = "Class" },
    { word = "sort", menu = "󰊕 [Func] sort(begin, end)", kind = "Function" },
    { word = "lower_bound", menu = "󰊕 [Func] lower_bound(begin, end, val)", kind = "Function" },
    { word = "upper_bound", menu = "󰊕 [Func] upper_bound(begin, end, val)", kind = "Function" },
    { word = "binary_search", menu = "󰊕 [Func] binary_search(begin, end, val)", kind = "Function" },
    { word = "reverse", menu = "󰊕 [Func] reverse(begin, end)", kind = "Function" },
    { word = "accumulate", menu = "󰊕 [Func] accumulate(begin, end, init)", kind = "Function" },
    { word = "max_element", menu = "󰊕 [Func] max_element(begin, end)", kind = "Function" },
    { word = "min_element", menu = "󰊕 [Func] min_element(begin, end)", kind = "Function" },
    { word = "next_permutation", menu = "󰊕 [Func] next_permutation(begin, end)", kind = "Function" },
    { word = "fill", menu = "󰊕 [Func] fill(begin, end, val)", kind = "Function" },
    { word = "iota", menu = "󰊕 [Func] iota(begin, end, val)", kind = "Function" },
    { word = "gcd", menu = "󰊕 [Func] std::gcd(a, b)", kind = "Function" },
    { word = "lcm", menu = "󰊕 [Func] std::lcm(a, b)", kind = "Function" },
    { word = "push_back", menu = "󰊕 [Method] push_back(val)", kind = "Method" },
    { word = "emplace_back", menu = "󰊕 [Method] emplace_back(...)", kind = "Method" },
    { word = "pop_back", menu = "󰊕 [Method] pop_back()", kind = "Method" },
    { word = "push", menu = "󰊕 [Method] push(val)", kind = "Method" },
    { word = "pop", menu = "󰊕 [Method] pop()", kind = "Method" },
    { word = "top", menu = "󰊕 [Method] top()", kind = "Method" },
    { word = "front", menu = "󰊕 [Method] front()", kind = "Method" },
    { word = "back", menu = "󰊕 [Method] back()", kind = "Method" },
    { word = "size", menu = "󰊕 [Method] size()", kind = "Method" },
    { word = "empty", menu = "󰊕 [Method] empty()", kind = "Method" },
    { word = "clear", menu = "󰊕 [Method] clear()", kind = "Method" },
    { word = "insert", menu = "󰊕 [Method] insert(val)", kind = "Method" },
    { word = "erase", menu = "󰊕 [Method] erase(pos)", kind = "Method" },
    { word = "find", menu = "󰊕 [Method] find(val)", kind = "Method" },
    { word = "count", menu = "󰊕 [Method] count(val)", kind = "Method" },
    { word = "begin", menu = "󰊕 [Method] begin()", kind = "Method" },
    { word = "end", menu = "󰊕 [Method] end()", kind = "Method" },
    { word = "rbegin", menu = "󰊕 [Method] rbegin()", kind = "Method" },
    { word = "rend", menu = "󰊕 [Method] rend()", kind = "Method" },
    { word = "cout", menu = "󰆧 [IO] std::cout", kind = "Variable" },
    { word = "cin", menu = "󰆧 [IO] std::cin", kind = "Variable" },
    { word = "endl", menu = "󰆧 [IO] std::endl", kind = "Variable" },
    { word = "long long", menu = " [Type] long long", kind = "Keyword" },
    { word = "long double", menu = " [Type] long double", kind = "Keyword" },
}

-- Python Keywords and Functions
M.python_keywords = {
    { word = "print", menu = "󰊕 [Func] print(*args, sep=' ', end='\\n')", kind = "Function" },
    { word = "input", menu = "󰊕 [Func] input()", kind = "Function" },
    { word = "range", menu = "󰊕 [Func] range(start, stop, step)", kind = "Function" },
    { word = "len", menu = "󰊕 [Func] len(obj)", kind = "Function" },
    { word = "map", menu = "󰊕 [Func] map(func, iter)", kind = "Function" },
    { word = "list", menu = "󰊕 [Func] list(iter)", kind = "Function" },
    { word = "dict", menu = "󰊕 [Func] dict()", kind = "Function" },
    { word = "set", menu = "󰊕 [Func] set()", kind = "Function" },
    { word = "sorted", menu = "󰊕 [Func] sorted(iter, key=None, reverse=False)", kind = "Function" },
    { word = "enumerate", menu = "󰊕 [Func] enumerate(iter, start=0)", kind = "Function" },
    { word = "zip", menu = "󰊕 [Func] zip(*iters)", kind = "Function" },
    { word = "bisect", menu = " [Module] import bisect", kind = "Module" },
    { word = "bisect_left", menu = "󰊕 [Func] bisect_left(a, x)", kind = "Function" },
    { word = "bisect_right", menu = "󰊕 [Func] bisect_right(a, x)", kind = "Function" },
    { word = "collections", menu = " [Module] import collections", kind = "Module" },
    { word = "defaultdict", menu = " [Class] collections.defaultdict", kind = "Class" },
    { word = "Counter", menu = " [Class] collections.Counter", kind = "Class" },
    { word = "deque", menu = " [Class] collections.deque", kind = "Class" },
    { word = "heapq", menu = " [Module] import heapq", kind = "Module" },
    { word = "heappush", menu = "󰊕 [Func] heapq.heappush(heap, item)", kind = "Function" },
    { word = "heappop", menu = "󰊕 [Func] heapq.heappop(heap)", kind = "Function" },
    { word = "heapify", menu = "󰊕 [Func] heapq.heapify(list)", kind = "Function" },
    { word = "math", menu = " [Module] import math", kind = "Module" },
    { word = "sys", menu = " [Module] import sys", kind = "Module" },
}

-- Gather buffer words
local function get_buffer_words(buf, current_word)
    local lines = vim.api.nvim_buf_get_lines(buf, 0, -1, false)
    local words = {}
    local seen = {}
    current_word = current_word:lower()

    for _, line in ipairs(lines) do
        for word in line:gmatch("[%a_][%w_]+") do
            if #word >= 2 and word:lower():find("^" .. current_word) and not seen[word] then
                seen[word] = true
                table.insert(words, {
                    word = word,
                    menu = "󰆧 [Buffer]",
                    kind = "Variable",
                })
            end
        end
    end
    return words
end

-- Generate Sublime-style popup completion list
function M.get_candidates(prefix, bufnr)
    local results = {}
    local seen = {}
    local p_lower = prefix:lower()
    local ft = vim.bo[bufnr].filetype

    -- 1. Match Snippets (Highest Priority)
    for key, snip in pairs(M.snippets_map) do
        if key:find("^" .. p_lower) or snip.word:lower():find("^" .. p_lower) then
            if not seen[snip.word] then
                seen[snip.word] = true
                table.insert(results, {
                    word = snip.word,
                    menu = snip.menu,
                    info = snip.info,
                    kind = snip.kind,
                    is_snippet = true,
                    code = snip.code,
                })
            end
        end
    end

    -- 2. Match Language Specific Keywords
    local kw_list = (ft == "python") and M.python_keywords or M.common_keywords
    for _, kw in ipairs(kw_list) do
        if kw.word:lower():find("^" .. p_lower) and not seen[kw.word] then
            seen[kw.word] = true
            table.insert(results, {
                word = kw.word,
                menu = kw.menu,
                kind = kw.kind,
            })
        end
    end

    -- 3. Match Buffer Identifiers
    local buf_words = get_buffer_words(bufnr, prefix)
    for _, bw in ipairs(buf_words) do
        if not seen[bw.word] then
            seen[bw.word] = true
            table.insert(results, bw)
        end
    end

    return results
end

-- Trigger Popup
function M.trigger_popup()
    if vim.fn.pumvisible() == 1 then return end
    local mode = vim.api.nvim_get_mode().mode
    if mode ~= "i" then return end

    local line = vim.api.nvim_get_current_line()
    local col = vim.api.nvim_win_get_cursor(0)[2]
    local before_cursor = line:sub(1, col)
    local start_col, prefix = before_cursor:match("()([%a_][%w_]*)$")

    if not prefix or #prefix < 1 then return end

    local bufnr = vim.api.nvim_get_current_buf()
    local candidates = M.get_candidates(prefix, bufnr)

    if #candidates > 0 then
        -- Sublime popup: 1-indexed column start
        vim.fn.complete(start_col, candidates)
    end
end

-- Expand snippet when confirmed
function M.on_confirm(item)
    if not item or not item.word then return end
    local snip = M.snippets_map[item.word]
    if snip and snip.code and snip.code:find("\n") then
        -- Multi-line snippet expansion
        vim.schedule(function()
            local cursor = vim.api.nvim_win_get_cursor(0)
            local row = cursor[1] - 1
            local line = vim.api.nvim_get_current_line()
            
            -- Replace snippet trigger on current line
            local lines_to_insert = vim.split(snip.code, "\n")
            vim.api.nvim_buf_set_lines(0, row, row + 1, false, lines_to_insert)
            vim.api.nvim_win_set_cursor(0, { row + #lines_to_insert, 0 })
        end)
    end
end

-- Setup highlights for Sublime Text Popup Aesthetics
function M.setup_highlights()
    vim.cmd([[
        " Sublime Text Dark Autocompletion Popup Palette
        highlight default Pmenu guibg=#21252b guifg=#abb2bf ctermbg=235 ctermfg=250
        highlight default PmenuSel guibg=#3b82f6 guifg=#ffffff gui=bold ctermbg=33 ctermfg=15 cterm=bold
        highlight default PmenuKind guibg=#21252b guifg=#61afef ctermbg=235 ctermfg=75
        highlight default PmenuExtra guibg=#21252b guifg=#5c6370 gui=italic ctermbg=235 ctermfg=241
        highlight default PmenuSbar guibg=#1e2227 ctermbg=234
        highlight default PmenuThumb guibg=#4b5263 ctermbg=239
    ]])
end

function M.setup()
    M.setup_highlights()

    -- Sublime-style Popup Menu Options
    vim.opt.completeopt = "menu,menuone,noinsert,noselect"
    vim.opt.pumheight = 12
    vim.opt.pumwidth = 25

    -- As-you-type instant trigger
    local group = vim.api.nvim_create_augroup("CPBuddyCompletion", { clear = true })
    vim.api.nvim_create_autocmd("TextChangedI", {
        group = group,
        callback = function()
            local bufnr = vim.api.nvim_get_current_buf()
            local ft = vim.bo[bufnr].filetype
            if ft == "cpbuddy_home" or ft == "cpbuddy_dashboard" then return end
            
            vim.schedule(function()
                M.trigger_popup()
            end)
        end,
    })

    -- Auto-expand snippets on completion selection
    vim.api.nvim_create_autocmd("CompleteDone", {
        group = group,
        callback = function()
            local item = vim.v.completed_item
            if item and item.word and M.snippets_map[item.word] then
                M.on_confirm(item)
            end
        end,
    })

    -- Sublime Tab / Enter / Escape Keymaps in Insert Mode
    vim.keymap.set("i", "<Tab>", function()
        if vim.fn.pumvisible() == 1 then
            return "<C-n>"
        else
            return "<Tab>"
        end
    end, { expr = true, silent = true, desc = "Next completion or Tab" })

    vim.keymap.set("i", "<S-Tab>", function()
        if vim.fn.pumvisible() == 1 then
            return "<C-p>"
        else
            return "<S-Tab>"
        end
    end, { expr = true, silent = true, desc = "Prev completion" })

    vim.keymap.set("i", "<CR>", function()
        if vim.fn.pumvisible() == 1 then
            return "<C-y>"
        else
            return "<CR>"
        end
    end, { expr = true, silent = true, desc = "Confirm completion" })
end

return M
