import { redirect } from "next/navigation";

export default function UserUploadPage() {
  redirect("/admin/videos/new");
}
