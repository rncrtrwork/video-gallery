import { saveCategoryAction, toggleCategoryAction } from "@/app/admin/actions";
import { getCategories } from "@/lib/repositories";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const [{ success, error }, categories] = await Promise.all([searchParams, getCategories(true)]);
  return (
    <>
      <div className="admin-heading"><div><div className="eyebrow">Organization</div><h1>Categories</h1></div></div>
      {success && <div className="flash-success">Category changes saved.</div>}{error && <div className="flash-error">Use a unique category name with at least two characters.</div>}
      <section className="admin-panel"><h2>Add category</h2><form className="form-grid" action={saveCategoryAction}><div className="form-group"><label htmlFor="name">Name</label><input className="form-control" id="name" name="name" required minLength={2} maxLength={60} /></div><div className="form-group"><label htmlFor="sortOrder">Sort order</label><input className="form-control" id="sortOrder" name="sortOrder" type="number" min="0" defaultValue="0" /></div><div className="form-actions full"><button className="btn" type="submit">Add category</button></div></form></section>
      <section className="admin-panel"><h2>Existing categories</h2>{categories.length ? <table className="admin-table"><thead><tr><th>Name</th><th>Slug</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead><tbody>{categories.map((category) => <tr key={category._id?.toHexString()}><td><form className="inline-actions" action={saveCategoryAction}><input type="hidden" name="id" value={category._id?.toHexString()} /><input className="form-control" name="name" defaultValue={category.name} aria-label={`Name for ${category.name}`} required /><input className="form-control" name="sortOrder" type="number" min="0" defaultValue={category.sortOrder} aria-label={`Sort order for ${category.name}`} /><button className="ghost" type="submit">Save</button></form></td><td>{category.slug}</td><td>{category.sortOrder}</td><td><span className="status">{category.isActive ? "active" : "inactive"}</span></td><td><form action={toggleCategoryAction}><input type="hidden" name="id" value={category._id?.toHexString()} /><input type="hidden" name="active" value={String(!category.isActive)} /><button className="ghost" type="submit">{category.isActive ? "Deactivate" : "Activate"}</button></form></td></tr>)}</tbody></table> : <p className="subtle">No categories yet.</p>}</section>
    </>
  );
}
