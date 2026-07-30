import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f7f2ea",
          border: "3px solid #b48a52",
          color: "#263e34",
          display: "flex",
          fontFamily: "serif",
          fontSize: 20,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "-1px",
          width: "100%",
        }}
      >
        Y&amp;N
      </div>
    ),
    size,
  );
}
