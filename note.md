## GAS & EIP-1559
- Burnt = Base Gas Fees * Gas used
- Tx Fee = (base fee per gas + max priority fee per gas) * gas used

## consensus(共识)
### Sybil Resistance(抗女巫攻击)
- PoW(proof of work): 工作量证明
    - mining
    - 
- PoS(proof of stake): 权益证明

### chain selector

## ethers.js
- [ethers.js](https://docs.ethers.org/v6/)

## tools
- [Ganache](https://archive.trufflesuite.com/ganache/)
    - 本地eth blockchain

## 🔐 Solidity 可见性修饰符对比表（函数 & 状态变量）

---

### ✅ 函数可见性对比

| 修饰符       | 合约外部可调用 | 当前合约可调用 | 派生合约可调用 | 内部调用方式             | 说明                                                                 |
|--------------|----------------|----------------|----------------|--------------------------|----------------------------------------------------------------------|
| `public`     | ✅ 是           | ✅ 是           | ✅ 是           | 直接调用（如 `foo()`）    | 默认开放性最强，适合对外公开使用的逻辑，合约外部和继承合约都能访问。              |
| `external`   | ✅ 是           | ❌ 否（需间接） | ❌ 否           | 需使用 `this.foo()`      | 只能合约外部调用；若内部需调用必须通过 `this`，即外部调用自己。效率较低。        |
| `internal`   | ❌ 否           | ✅ 是           | ✅ 是           | 直接调用（如 `foo()`）    | 限定为合约内部和继承合约可见，常用于库函数、逻辑复用，不对外开放。               |
| `private`    | ❌ 否           | ✅ 是           | ❌ 否           | 直接调用（如 `foo()`）    | 最严格的访问控制，仅限当前合约本身可访问。子合约无法访问，即使继承。              |

---

### 🧱 状态变量可见性对比

| 修饰符       | 可通过合约外部访问 | 当前合约可访问 | 派生合约可访问 | 是否生成 getter | 说明                                                                 |
|--------------|--------------------|----------------|----------------|------------------|----------------------------------------------------------------------|
| `public`     | ✅ 是               | ✅ 是           | ✅ 是           | ✅ 会自动生成     | 最开放的变量修饰符，合约外部可以读取（不能写），会自动生成 getter 函数。        |
| `internal`   | ❌ 否               | ✅ 是           | ✅ 是           | ❌ 不生成         | 只能在当前合约和继承的子合约中使用，不会自动生成 getter。                      |
| `private`    | ❌ 否               | ✅ 是           | ❌ 否           | ❌ 不生成         | 仅限当前合约访问，子合约无法访问，不会生成 getter 函数。                       |

---

### 📌 注意事项

- **函数默认可见性**：Solidity 0.5.0+ 开始必须显式指定函数可见性，否则会编译失败。
- **状态变量默认可见性**：默认是 `internal`，但最好也显式声明。
- **external vs public**：`external` 节省内存（参数存储在 `calldata`），但只能外部用。`public` 灵活，可内外调用，调用效率高。
- **getter 函数生成**：`public` 变量会自动生成一个只读的 getter，写入仍需要 setter 函数。

---

### 📘 示例代码

```solidity
contract Example {
    uint public a = 1;       // 有 getter：a()
    uint internal b = 2;     // 只能内部或子合约访问
    uint private c = 3;      // 只能本合约访问

    function foo() public {}         // 任何人都能调用
    function bar() external {}       // 只能外部调用，合约内部调用需 this.bar()
    function baz() internal {}       // 合约内部和子合约可调用
    function qux() private {}        // 仅当前合约内可用
}
```

