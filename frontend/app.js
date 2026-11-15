import { api } from "./api.js";
import { DEMO_MODE } from "./config.js";

const $ = selector => document.querySelector(selector);
const types = { phone: "电话", email: "邮箱", social: "社交", address: "地址", other: "其他" };
const state = { contacts: [], favorites: false, query: "", editingId: null, deletingId: null, loaded: false, loading: false, saving: false };
let requestVersion = 0;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function feedback(message, kind = "success") {
  const element = $("#feedback");
  element.textContent = message;
  element.className = `feedback ${kind}`;
  element.hidden = !message;
}
function validateContacts(data) {
  if (!Array.isArray(data?.contacts)) throw new Error("接口格式不符：期望 contacts 数组，请核对接口文档。");
  const ids = new Set();
  for (const item of data.contacts) {
    if (!item || !["string", "number"].includes(typeof item.id) || String(item.id) === "" || ids.has(String(item.id)) || typeof item.name !== "string" || typeof item.is_favorite !== "boolean" || typeof item.notes !== "string" || !Array.isArray(item.methods) || item.methods.some(m => !m || !Object.hasOwn(types, m.type) || typeof m.value !== "string")) {
      throw new Error("联系人字段不符合接口约定，请检查 id、name、notes、is_favorite 和 methods。");
    }
    ids.add(String(item.id));
  }
  return data.contacts;
}

function contactCard(contact) {
  const card = node("article", "contact-card");
  card.dataset.id = contact.id;
  const heading = node("div", "card-heading");
  heading.append(node("span", "avatar", Array.from(contact.name)[0] || "人"));
  const identity = node("div", "identity");
  identity.append(node("h3", "", contact.name), node("p", "notes", contact.notes || "还没有备注"));
  const favorite = node("button", "icon-button", contact.is_favorite ? "★" : "☆");
  favorite.type = "button";
  favorite.setAttribute("aria-label", `${contact.is_favorite ? "取消" : "设为"}特别关注：${contact.name}`);
  favorite.setAttribute("aria-pressed", String(contact.is_favorite));
  favorite.addEventListener("click", async () => {
    favorite.disabled = true;
    try {
      await api.favorite(contact.id, !contact.is_favorite);
      await loadContacts("收藏状态已更新。");
    } catch (error) { feedback(error.message, "error"); }
    finally { favorite.disabled = false; }
  });
  heading.append(identity, favorite);
  const methods = node("div", "methods");
  for (const method of contact.methods) {
    const line = node("div", "method-line");
    line.append(node("span", "method-label", types[method.type]), node("span", "method-value", method.value));
    methods.append(line);
  }
  if (!contact.methods.length) methods.append(node("span", "method-value", "暂未填写联系方式"));
  const actions = node("div", "card-actions");
  const edit = node("button", "text-button", "编辑资料");
  edit.setAttribute("aria-label", `编辑 ${contact.name}`);
  edit.addEventListener("click", () => openEditor(contact));
  const remove = node("button", "text-button delete", "删除");
  remove.setAttribute("aria-label", `删除 ${contact.name}`);
  remove.addEventListener("click", () => {
    state.deletingId = contact.id;
    $("#delete-description").textContent = `即将删除「${contact.name}」及其全部联系方式。`;
    $("#delete-error").hidden = true;
    $("#delete-dialog").showModal();
    $("#cancel-delete").focus();
  });
  actions.append(edit, remove);
  card.append(heading, methods, actions);
  return card;
}

function render() {
  const favorites = state.contacts.filter(contact => contact.is_favorite);
  $("#all-count").textContent = $("#stat-total").textContent = state.loaded ? state.contacts.length : "—";
  $("#favorite-count").textContent = $("#stat-favorite").textContent = state.loaded ? favorites.length : "—";
  $("#stat-methods").textContent = state.loaded ? state.contacts.reduce((sum, item) => sum + item.methods.length, 0) : "—";
  for (const [selector, active] of [["#all-nav", !state.favorites], ["#favorite-nav", state.favorites]]) {
    $(selector).classList.toggle("active", active);
    $(selector).setAttribute("aria-pressed", String(active));
  }
  $("#list-title").textContent = state.favorites ? "特别关注" : "全部联系人";
  const query = state.query.trim().toLocaleLowerCase();
  const filtered = state.contacts.filter(contact => (!state.favorites || contact.is_favorite) && [contact.name, contact.notes, ...contact.methods.map(method => method.value)].some(value => value.toLocaleLowerCase().includes(query)));
  $("#contact-list").replaceChildren(...filtered.map(contactCard));
  $("#result-count").textContent = state.loaded ? `${filtered.length} 位联系人` : (state.loading ? "正在连接…" : "连接失败");
  $("#empty-state").hidden = !state.loaded || filtered.length > 0;
  $("#empty-title").textContent = query ? "没有找到匹配的联系人" : (state.favorites ? "还没有特别关注" : "还没有联系人");
  $("#empty-description").textContent = query ? "试试其他姓名或联系方式。" : (state.favorites ? "点击联系人卡片右上角的星标，将重要的人收藏起来。" : "新建一位联系人，开始整理你的连接。");
}

async function loadContacts(successMessage) {
  const version = ++requestVersion;
  state.loading = true;
  $("#contact-list").setAttribute("aria-busy", "true");
  $("#error-state").hidden = true;
  $("#empty-state").hidden = true;
  $("#import-button").disabled = $("#export-button").disabled = true;
  try {
    const contacts = validateContacts(await api.list());
    if (version !== requestVersion) return;
    state.contacts = contacts;
    state.loaded = true;
    feedback(successMessage || "");
  } catch (error) {
    if (version !== requestVersion) return;
    state.loaded = false;
    state.contacts = [];
    $("#error-state").hidden = false;
    feedback(successMessage ? `${successMessage}但刷新失败，请重新连接核实结果。${error.message}` : error.message, "error");
  } finally {
    if (version === requestVersion) {
      state.loading = false;
      $("#contact-list").setAttribute("aria-busy", "false");
      $("#import-button").disabled = $("#export-button").disabled = !state.loaded;
      render();
    }
  }
}

function addMethod(method = { type: "phone", value: "" }) {
  if ($("#method-fields").children.length >= 30) {
    showFormError("最多添加 30 项联系方式。"); return;
  }
  const row = node("div", "method-row");
  const select = node("select");
  select.setAttribute("aria-label", "联系方式类型");
  for (const [value, label] of Object.entries(types)) {
    const option = node("option", "", label);
    option.value = value;
    select.append(option);
  }
  select.value = method.type;
  const input = node("input");
  input.value = method.value;
  input.required = true;
  input.maxLength = 300;
  const updateType = () => {
    input.type = select.value === "email" ? "email" : "text";
    input.inputMode = select.value === "phone" ? "tel" : (select.value === "email" ? "email" : "text");
    input.placeholder = `请输入${types[select.value]}`;
    input.setAttribute("aria-label", `${types[select.value]}内容`);
  };
  select.addEventListener("change", updateType);
  updateType();
  const remove = node("button", "icon-button", "×");
  remove.type = "button";
  remove.setAttribute("aria-label", "移除此联系方式");
  remove.addEventListener("click", () => { row.remove(); $("#add-method").focus(); });
  row.append(select, input, remove);
  $("#method-fields").append(row);
}
function showFormError(message) {
  $("#form-error").textContent = message;
  $("#form-error").hidden = !message;
}
function openEditor(contact = null) {
  state.editingId = contact?.id ?? null;
  $("#contact-form").reset();
  $("#dialog-title").textContent = contact ? "编辑联系人" : "新建联系人";
  $("#contact-name").value = contact?.name || "";
  $("#contact-notes").value = contact?.notes || "";
  $("#contact-favorite").checked = contact?.is_favorite || false;
  $("#method-fields").replaceChildren();
  (contact ? contact.methods : [{ type: "phone", value: "" }]).forEach(addMethod);
  showFormError("");
  $("#contact-dialog").showModal();
  $("#contact-name").focus();
}
function closeEditor() { if (!state.saving) $("#contact-dialog").close(); }
$("#contact-dialog").addEventListener("cancel", event => { if (state.saving) event.preventDefault(); });
$("#contact-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (state.saving) return;
  const contact = {
    name: $("#contact-name").value.trim(),
    notes: $("#contact-notes").value.trim(),
    is_favorite: $("#contact-favorite").checked,
    methods: [...$("#method-fields").children].map(row => ({ type: row.querySelector("select").value, value: row.querySelector("input").value.trim() })),
  };
  if (!contact.name || contact.methods.some(method => !method.value)) {
    showFormError("姓名和已添加的联系方式不能为空；不需要的联系方式请移除。"); return;
  }
  state.saving = true;
  const controls = [...$("#contact-form").querySelectorAll("input,textarea,select,button")];
  controls.forEach(control => { control.disabled = true; });
  $("#save-contact").textContent = "保存中…";
  showFormError("");
  try {
    if (state.editingId !== null) await api.update(state.editingId, contact);
    else await api.create(contact);
    $("#contact-dialog").close();
    await loadContacts("联系人已保存。");
  } catch (error) { showFormError(error.message); }
  finally {
    state.saving = false;
    controls.forEach(control => { control.disabled = false; });
    $("#save-contact").textContent = "保存联系人";
  }
});

let deleting = false;
$("#cancel-delete").addEventListener("click", () => { if (!deleting) $("#delete-dialog").close(); });
$("#delete-dialog").addEventListener("cancel", event => { if (deleting) event.preventDefault(); });
$("#delete-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (deleting) return;
  deleting = true;
  $("#confirm-delete").disabled = $("#cancel-delete").disabled = true;
  try {
    await api.remove(state.deletingId);
    $("#delete-dialog").close();
    await loadContacts("联系人已删除。");
  } catch (error) {
    $("#delete-error").textContent = error.message;
    $("#delete-error").hidden = false;
  } finally { deleting = false; $("#confirm-delete").disabled = $("#cancel-delete").disabled = false; }
});

$("#import-button").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", async event => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  if (!/\.xlsx$/i.test(file.name)) { feedback("请选择 .xlsx 格式的 Excel 文件。", "error"); return; }
  if (!file.size || file.size > 5 * 1024 * 1024) { feedback("文件不能为空，且不能超过 5 MiB。", "error"); return; }
  $("#import-button").disabled = true;
  feedback("正在导入，请稍候…", "info");
  try {
    const result = await api.importFile(file);
    if (!Number.isInteger(result?.imported) || result.imported < 0) throw new Error("导入响应格式不符，请重新连接确认数据，勿重复导入。");
    await loadContacts(`成功导入 ${result.imported} 位联系人。`);
  } catch (error) { feedback(error.message, "error"); }
  finally { $("#import-button").disabled = !state.loaded; }
});
$("#export-button").addEventListener("click", async () => {
  $("#export-button").disabled = true;
  feedback("正在生成 Excel…", "info");
  try {
    const { blob, filename } = await api.exportFile();
    const url = URL.createObjectURL(blob);
    const link = node("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    feedback("已开始下载全部联系人的 Excel 文件。");
  } catch (error) { feedback(error.message, "error"); }
  finally { $("#export-button").disabled = !state.loaded; }
});

$("#all-nav").addEventListener("click", () => { state.favorites = false; render(); });
$("#favorite-nav").addEventListener("click", () => { state.favorites = true; render(); });
$("#search").addEventListener("input", event => { state.query = event.target.value; render(); });
$("#add-contact").addEventListener("click", () => openEditor());
$("#empty-add").addEventListener("click", () => openEditor());
$("#add-method").addEventListener("click", () => { addMethod(); $("#method-fields .method-row:last-child input")?.focus(); });
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", closeEditor));
$("#retry").addEventListener("click", () => loadContacts());
$("#demo-banner").hidden = !DEMO_MODE;
await loadContacts();
