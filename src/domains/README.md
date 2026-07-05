# PAVORA Domains

四大領域：model / wardrobe / scene / ipContent。

依賴方向規則（不准反向）：

```
UI 模組 (src/modules, src/shell) → domain (src/domains/*) → pipeline / 儲存層 (services, stores)
```

- domain 層不可 import UI 模組。
- domain 之間互相依賴需明確評估，優先避免循環依賴。
- 新功能開工前，先問：這個型別/邏輯屬於哪個 domain？不確定就先問 Hank，不要塞進 shared。
