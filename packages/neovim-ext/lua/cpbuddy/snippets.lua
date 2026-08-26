local M = {}
local utils = require("cpbuddy.utils")

M.library = {
    {
        name = "DSU (Disjoint Set Union)",
        category = "Data Structures",
        description = "Disjoint Set Union with path compression and union-by-size",
        code = [==[
struct DSU {
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
};
]==]
    },
    {
        name = "Fenwick Tree (BIT)",
        category = "Data Structures",
        description = "1D Binary Indexed Tree for prefix sums and point updates",
        code = [==[
template <typename T = long long>
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
};
]==]
    },
    {
        name = "Segment Tree (Point Update, Range Query)",
        category = "Data Structures",
        description = "Standard iterative segment tree for associative operations (sum/min/max)",
        code = [==[
template <typename T>
struct SegTree {
    int n;
    vector<T> tree;
    T neutral;
    function<T(T, T)> merge;

    SegTree(int n, T neutral, function<T(T, T)> merge) 
        : n(n), neutral(neutral), merge(merge), tree(2 * n, neutral) {}

    void update(int pos, T val) {
        for (tree[pos += n] = val; pos > 1; pos >>= 1) {
            tree[pos >> 1] = merge(tree[pos], tree[pos ^ 1]);
        }
    }

    T query(int l, int r) { // [l, r] inclusive
        T res_l = neutral, res_r = neutral;
        for (l += n, r += n + 1; l < r; l >>= 1, r >>= 1) {
            if (l & 1) res_l = merge(res_l, tree[l++]);
            if (r & 1) res_r = merge(tree[--r], res_r);
        }
        return merge(res_l, res_r);
    }
};
]==]
    },
    {
        name = "Lazy Segment Tree (Range Update, Range Query)",
        category = "Data Structures",
        description = "Recursive segment tree with lazy propagation for range updates",
        code = [==[
struct LazySegTree {
    int n;
    vector<long long> tree, lazy;
    LazySegTree(int n) : n(n), tree(4 * n, 0), lazy(4 * n, 0) {}

    void push(int node, int l, int r) {
        if (lazy[node] != 0) {
            tree[node] += (r - l + 1) * lazy[node];
            if (l != r) {
                lazy[2 * node] += lazy[node];
                lazy[2 * node + 1] += lazy[node];
            }
            lazy[node] = 0;
        }
    }

    void update(int node, int l, int r, int ql, int qr, long long val) {
        push(node, l, r);
        if (ql > r || qr < l) return;
        if (ql <= l && r <= qr) {
            lazy[node] += val;
            push(node, l, r);
            return;
        }
        int mid = (l + r) / 2;
        update(2 * node, l, mid, ql, qr, val);
        update(2 * node + 1, mid + 1, r, ql, qr, val);
        tree[node] = tree[2 * node] + tree[2 * node + 1];
    }

    long long query(int node, int l, int r, int ql, int qr) {
        push(node, l, r);
        if (ql > r || qr < l) return 0;
        if (ql <= l && r <= qr) return tree[node];
        int mid = (l + r) / 2;
        return query(2 * node, l, mid, ql, qr) + query(2 * node + 1, mid + 1, r, ql, qr);
    }
};
]==]
    },
    {
        name = "Modular Arithmetic (Mint)",
        category = "Math",
        description = "Complete modular integer class with operator overloading",
        code = [==[
template <int MOD = 1000000007>
struct Mint {
    int val;
    Mint(long long v = 0) { val = v % MOD; if (val < 0) val += MOD; }
    Mint operator+=(const Mint& o) { val = (val + o.val >= MOD ? val + o.val - MOD : val + o.val); return *this; }
    Mint operator-=(const Mint& o) { val = (val - o.val < 0 ? val - o.val + MOD : val - o.val); return *this; }
    Mint operator*=(const Mint& o) { val = (1LL * val * o.val) % MOD; return *this; }
    Mint power(long long p) const {
        Mint res = 1, base = *this;
        while (p > 0) { if (p & 1) res *= base; base *= base; p >>= 1; }
        return res;
    }
    Mint inv() const { return power(MOD - 2); }
    Mint operator/=(const Mint& o) { return *this *= o.inv(); }
    friend Mint operator+(Mint a, const Mint& b) { return a += b; }
    friend Mint operator-(Mint a, const Mint& b) { return a -= b; }
    friend Mint operator*(Mint a, const Mint& b) { return a *= b; }
    friend Mint operator/(Mint a, const Mint& b) { return a /= b; }
    friend ostream& operator<<(ostream& os, const Mint& m) { return os << m.val; }
};
using mint = Mint<1000000007>;
]==]
    },
    {
        name = "Fast Modular Exponentiation (binpow)",
        category = "Math",
        description = "O(log b) power calculation with modulus",
        code = [==[
long long binpow(long long a, long long b, long long mod = 1000000007) {
    long long res = 1;
    a %= mod;
    while (b > 0) {
        if (b & 1) res = (__int128)res * a % mod;
        a = (__int128)a * a % mod;
        b >>= 1;
    }
    return res;
}
]==]
    },
    {
        name = "Linear Sieve (SPF & Primes)",
        category = "Math",
        description = "Computes Smallest Prime Factor (SPF) and primes up to N in O(N)",
        code = [==[
const int MAX_PRIME = 1000005;
vector<int> primes, spf(MAX_PRIME);

void sieve() {
    for (int i = 2; i < MAX_PRIME; i++) {
        if (spf[i] == 0) {
            spf[i] = i;
            primes.push_back(i);
        }
        for (int p : primes) {
            if (p > spf[i] || i * p >= MAX_PRIME) break;
            spf[i * p] = p;
        }
    }
}
]==]
    },
    {
        name = "Combinatorics (nCr with Precomputed Factorials)",
        category = "Math",
        description = "O(1) nCr queries after O(N) precomputation",
        code = [==[
const int MAX_FACT = 1000005;
const int MOD = 1000000007;
long long fact[MAX_FACT], invFact[MAX_FACT];

void precompute_nCr() {
    fact[0] = invFact[0] = 1;
    for (int i = 1; i < MAX_FACT; i++) fact[i] = (fact[i - 1] * i) % MOD;
    invFact[MAX_FACT - 1] = binpow(fact[MAX_FACT - 1], MOD - 2, MOD);
    for (int i = MAX_FACT - 2; i >= 1; i--) invFact[i] = (invFact[i + 1] * (i + 1)) % MOD;
}

long long nCr(int n, int r) {
    if (r < 0 || r > n) return 0;
    return fact[n] * invFact[r] % MOD * invFact[n - r] % MOD;
}
]==]
    },
    {
        name = "Dijkstra (Shortest Path)",
        category = "Graphs",
        description = "Single-source shortest path using priority_queue",
        code = [==[
vector<long long> dijkstra(int start, int n, const vector<vector<pair<int, long long>>>& adj) {
    const long long INF = 1e18;
    vector<long long> dist(n + 1, INF);
    priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;
    
    dist[start] = 0;
    pq.push({0, start});
    
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}
]==]
    },
    {
        name = "Binary Lifting LCA (Lowest Common Ancestor)",
        category = "Graphs",
        description = "Tree LCA and k-th ancestor queries in O(log N)",
        code = [==[
struct TreeLCA {
    int n, LOG;
    vector<int> depth;
    vector<vector<int>> up;

    TreeLCA(int n, int root, const vector<vector<int>>& adj) : n(n) {
        LOG = 32 - __builtin_clz(n);
        depth.assign(n + 1, 0);
        up.assign(n + 1, vector<int>(LOG, 0));
        
        function<void(int, int)> dfs = [&](int u, int p) {
            up[u][0] = p;
            for (int j = 1; j < LOG; j++) up[u][j] = up[up[u][j - 1]][j - 1];
            for (int v : adj[u]) {
                if (v != p) {
                    depth[v] = depth[u] + 1;
                    dfs(v, u);
                }
            }
        };
        dfs(root, root);
    }

    int lca(int u, int v) {
        if (depth[u] < depth[v]) swap(u, v);
        for (int j = LOG - 1; j >= 0; j--) {
            if (depth[u] - (1 << j) >= depth[v]) u = up[u][j];
        }
        if (u == v) return u;
        for (int j = LOG - 1; j >= 0; j--) {
            if (up[u][j] != up[v][j]) {
                u = up[u][j];
                v = up[v][j];
            }
        }
        return up[u][0];
    }
};
]==]
    },
    {
        name = "Binary Search on Answer Template",
        category = "Techniques",
        description = "Monotonic predicate binary search pattern",
        code = [==[
auto check = [&](long long mid) -> bool {
    // Return true if mid is a valid / attainable answer
    return false;
};

long long l = 0, r = 1e18, ans = -1;
while (l <= r) {
    long long mid = l + (r - l) / 2;
    if (check(mid)) {
        ans = mid;
        l = mid + 1; // Or r = mid - 1 for minimizing
    } else {
        r = mid - 1; // Or l = mid + 1 for minimizing
    }
}
]==]
    },
    {
        name = "KMP String Matching",
        category = "Strings",
        description = "Computes Pi array and performs linear time string matching",
        code = [==[
vector<int> compute_pi(const string& s) {
    int n = s.size();
    vector<int> pi(n, 0);
    for (int i = 1; i < n; i++) {
        int j = pi[i - 1];
        while (j > 0 && s[i] != s[j]) j = pi[j - 1];
        if (s[i] == s[j]) j++;
        pi[i] = j;
    }
    return pi;
}
]==]
    },
}

function M.open_picker()
    -- Create floating picker
    local items = {}
    for i, snip in ipairs(M.library) do
        table.insert(items, string.format("[%s] %s - %s", snip.category, snip.name, snip.description))
    end

    vim.ui.select(items, {
        prompt = "📦 CPBuddy Algorithm & Snippet Library:",
        format_item = function(item) return item end,
    }, function(choice, idx)
        if choice and idx and M.library[idx] then
            local selected = M.library[idx]
            local lines = vim.split(selected.code, "\n")
            
            -- Insert at cursor
            local row, col = unpack(vim.api.nvim_win_get_cursor(0))
            vim.api.nvim_put(lines, "l", true, true)
            utils.notify("Inserted snippet: " .. selected.name, vim.log.levels.INFO)
        end
    end)
end

return M
