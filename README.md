# StudentGrade

Ứng dụng quản lý học tập cho học sinh, giáo viên và phụ huynh.

## Yêu cầu

- Node.js và npm
- Trình duyệt hiện đại có hỗ trợ JavaScript và `localStorage`

## Khởi động ứng dụng

Mở PowerShell tại thư mục dự án:

```powershell
cd "D:\projects\demo apps\studentgrade\studentgrade"
npx serve .
```

Sau khi server khởi động, mở địa chỉ được hiển thị trong terminal, thường là:

```text
http://localhost:3000
```

Có thể dùng một static server khác, ví dụ:

```powershell
npx http-server .
```

Không nên mở trực tiếp `index.html` bằng `file://`, vì trình duyệt có thể chặn việc tải các file JSON trong thư mục `data`.

## Tài khoản demo

Tất cả tài khoản dưới đây dùng mật khẩu: `123456`

| Vai trò | Tài khoản |
| --- | --- |
| Học sinh | `minhanh`, `bich`, `dung`, `ha`, `huy`, `linh`, `nam`, `quynh` |
| Giáo viên | `co.nguyen`, `thay.tran`, `teacher` |
| Phụ huynh | `ph.hung`, `ph.bao`, `parent` |

## Cấu trúc chính

- `index.html`: điểm vào của ứng dụng
- `css/`: design system, component styles và animation
- `js/`: logic ứng dụng, router và các màn hình theo vai trò
- `data/`: dữ liệu học sinh, môn học và tài khoản demo

## Lưu ý phát triển

- Dữ liệu đăng nhập, bài nộp, thông báo và giao diện được lưu trong `localStorage` của trình duyệt.
- Để xóa dữ liệu đã lưu và quay lại trạng thái ban đầu, xóa dữ liệu trang web của `localhost:3000` hoặc chạy trong DevTools:

```javascript
localStorage.clear();
```
