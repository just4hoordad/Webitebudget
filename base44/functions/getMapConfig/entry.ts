import { secrets } from "base44:runtime";

export default async function(req: Request): Promise<Response> {
  try {
    const key = secrets.get("cartomapkey") || "";
    
    let tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";
    if (key && key.trim().length > 0) {
      tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${encodeURIComponent(key.trim())}`;
    }

    return Response.json({
      tileUrl,
      hasKey: Boolean(key && key.trim().length > 0),
    });
  } catch (error: any) {
    return Response.json({
      tileUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      hasKey: false,
      error: error?.message,
    });
  }
}