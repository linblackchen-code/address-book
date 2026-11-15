// Explicit UI-only preview. No file import/export or persistence is simulated.
let contacts = [
  { id: 1, name: "林知夏", notes: "产品设计 · 星野工作室", is_favorite: true, methods: [{ type: "phone", value: "13800000001" }, { type: "email", value: "zhixia@example.com" }, { type: "social", value: "微信：demo_zhixia" }] },
  { id: 2, name: "陈予安", notes: "后端开发 · 项目协作", is_favorite: true, methods: [{ type: "phone", value: "13800000002" }, { type: "email", value: "yuan@example.com" }] },
  { id: 3, name: "许清和", notes: "摄影师 · 城市漫游", is_favorite: false, methods: [{ type: "email", value: "qinghe@example.com" }, { type: "social", value: "小红书：demo_qinghe" }] },
  { id: 4, name: "周以宁", notes: "市场合作 · 青禾品牌", is_favorite: false, methods: [{ type: "phone", value: "13800000004" }, { type: "phone", value: "0591-00000004" }, { type: "email", value: "yining@example.com" }] },
  { id: 5, name: "沈亦舟", notes: "大学同学 · 保持联系", is_favorite: true, methods: [{ type: "email", value: "yizhou@example.com" }, { type: "address", value: "福建省福州市 · 示例地址" }] },
  { id: 6, name: "顾晚晴", notes: "内容编辑 · 灵感交换", is_favorite: false, methods: [{ type: "phone", value: "13800000006" }, { type: "email", value: "wanqing@example.com" }] },
];
let nextId = 7;
const copy = value => structuredClone(value);
function find(id) {
  const contact = contacts.find(item => String(item.id) === String(id));
  if (!contact) throw new Error("联系人不存在。");
  return contact;
}
export const demoApi = {
  async list() { return { contacts: copy(contacts) }; },
  async create(contact) { const item = { ...copy(contact), id: nextId++ }; contacts.push(item); return copy(item); },
  async update(id, contact) { Object.assign(find(id), copy(contact)); return copy(find(id)); },
  async remove(id) { find(id); contacts = contacts.filter(item => String(item.id) !== String(id)); },
  async favorite(id, value) { find(id).is_favorite = value; return copy(find(id)); },
  async importFile() { throw new Error("演示模式不解析 Excel。请连接真实后端后验证导入。"); },
  async exportFile() { throw new Error("演示模式不生成 Excel。请连接真实后端后验证导出。"); },
};
