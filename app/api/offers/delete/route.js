
import dbConnect from "@/lib/db";
import Offer from "@/models/ecom_offer_info";

export async function DELETE(req) {
  await dbConnect();

  try {
    const { id } = await req.json(); // Parse JSON body
    console.log("Request ID:", id);

    if (!id) {
      return Response.json({ success: false, message: "Offer ID is required" });
    }

    const deletedOffer = await Offer.findByIdAndDelete(id);
    console.log("Deleted Offer:", deletedOffer);

    if (!deletedOffer) {
      return Response.json({ success: false, message: "Offer not found" });
    }

    return Response.json({ success: true, message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Error deleting offer:", error);
    return Response.json({ success: false, message: "Internal Server Error" });
  }
}
