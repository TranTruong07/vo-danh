import Link from "next/link";

export default function CharacterNotFound() {
  return <section className="scanner-panel"><h1>Chưa tìm thấy nhân vật</h1><p>Thẻ này không tồn tại hoặc nhân vật đã bị xóa.</p><Link className="game-button primary" href="/play">Quét mã khác</Link></section>;
}
