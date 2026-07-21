# API 端点设计

## 1. API 风格

RESTful 风格，基于 Supabase 原生 API + 自定义 Edge Functions。

---

## 2. Notebooks

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/notebooks` | 获取当前用户所有笔记本 |
| POST | `/api/notebooks` | 创建笔记本 |
| PUT | `/api/notebooks/:id` | 更新笔记本名称 |
| DELETE | `/api/notebooks/:id` | 删除笔记本（级联删除所有Sheet和Row） |
| POST | `/api/notebooks/reorder` | 重新排序笔记本（接收ID顺序数组） |

---

## 3. Sheets

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/sheets?notebook_id=:id` | 获取某笔记本下所有页 |
| POST | `/api/sheets` | 创建新页（需传入 notebook_id） |
| PUT | `/api/sheets/:id` | 更新页标题或 columns_config |
| DELETE | `/api/sheets/:id` | 删除页 |
| POST | `/api/sheets/duplicate/:id` | 复制页 |
| POST | `/api/sheets/move/:id` | 移动页到其他笔记本 |
| POST | `/api/sheets/reorder` | 重新排序页 |

---

## 4. Rows

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/rows?sheet_id=:id` | 获取某页所有行（按 rows_order 排序） |
| POST | `/api/rows` | 新增行 |
| PUT | `/api/rows/:id` | 更新行数据（cells_data） |
| DELETE | `/api/rows/:id` | 删除行 |
| POST | `/api/rows/reorder` | 重新排序行 |
| PUT | `/api/rows/batch-hidden` | 批量更新 is_hidden 状态 |

---

## 5. Inflection（AI补全）

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/inflect/analyze` | 分析单词，返回词元信息 |
| POST | `/api/inflect/generate` | 生成变格（传入原形、词性、目标格列表） |

---

## 6. Export

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/export/image` | 导出表格为图片（服务端渲染+截图） |

---

## 7. 拖拽排序通用逻辑

### 数据模型
所有可排序实体必须包含：
- `id`: UUID（唯一标识）
- `order_array`: UUID[]（父级对象中存储有序ID数组）

### 操作流程
1. 前端渲染时根据 `order_array` 排序
2. 拖拽结束后：
   - 乐观更新：立即调整本地 `order_array`
   - 异步保存：防抖500ms后调用 `POST /api/xxx/reorder` 传入新数组
3. 后端验证：
   - 检查数组长度和元素合法性
   - 原子更新（事务）
   - 返回最新数据

### 异常处理
- 网络失败：Toast提示，保留前端新顺序，标记 `sync_pending`
- 下次操作时静默重试（指数退避）
- 若冲突（其他端同时修改），后端返回最新数据，前端强制同步（用户无感）

---

## 8. 批量选择状态管理

```typescript
interface SelectionState {
  mode: 'idle' | 'selecting';    // idle / selecting
  selectedCells: string[];        // 格式: "rowId_colId"
  allSelected: boolean;
}
操作规则
进入选择模式：长按0.5s 或 点击「选择」按钮

选择模式禁用：编辑、AI生成、拖拽排序

全选：仅选中当前可见列（不包含备注列）

批量隐藏/显示：仅更新 cells_data[rowId][colId].gender_values.*.is_hidden

操作完成后自动退出选择模式

9. 移动端手势规范
手势	      触发条件	  响应
长按（单元格）	0.5s	进入选择模式
长按（拖拽手柄）	0.3s	进入拖拽模式
左划（页签/行）	swipe left	显示操作菜单（删除/复制/移动）
右划（页签/行）	swipe right	退出操作菜单或返回
滑动（勾选框）	触摸滑动	连续多选（iOS照片同款）
10. 性能指标
指标	目标值
表格渲染（100行 × 15列）	< 500ms
规则引擎首次查询（Top 2000）	< 50ms
规则引擎首次查询（2000+）	100-300ms
拖拽排序响应	< 200ms（动画平滑）
API 响应（CRUD）	< 200ms (P95)
导出图片	< 3s (100行以内)