import pb from "../../utils/pb";
import { Collections } from "../../utils/pocketbase-types";

export async function POST({ request }) {
  const data = await request.json();
  console.log("Received data to update:", data);
  
  try {
    const { id, ...updateData } = data;
    
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "ID is required" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const record = await pb
      .collection(Collections.Svg)
      .update(id, updateData);
    
    console.log("SVG updated with ID:", record.id);

    return new Response(JSON.stringify({ success: true, record }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating SVG:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}
