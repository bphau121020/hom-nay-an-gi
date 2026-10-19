/* ==========================================================
   DỮ LIỆU MÓN – trang web tự ghi file này khi bạn bấm "Lưu vào data.js".
   Cũng có thể sửa tay, mỗi món là 1 dòng:
   id     : không dấu, không trùng nhau
   name   : tên món            emoji : hiện khi chưa có ảnh
   desc   : mô tả ngắn         tags  : nhóm để lọc
   price  : giá (số, đơn vị đồng) – dùng để lọc ngân sách và tính độ hiếm
   link   : link đặt món (trống = mở Google Maps tìm quán)
   image  : đường dẫn ảnh (trống = images/<id>.jpg, không có thì hiện emoji)
   rarity : trống = tự tính theo giá, hoặc thuong | hiem | suthi | huyenthoai | covat
   off    : true = ẩn món khỏi két
   ========================================================== */

window.MENU = {
  food: [
    {"id":"mi-quang","name":"Mỳ Quảng","emoji":"🍜","desc":"Sợi mì vàng, nước dùng đậm đà, thêm đậu phộng và bánh tráng giòn chuẩn vị miền Trung.","tags":["khô","chắc bụng"],"price":45000,"link":"","image":"","rarity":"","off":false},
    {"id":"bun-mam","name":"Bún mắm","emoji":"🥣","desc":"Nước lèo mắm đậm đà, ăn cùng thịt heo quay, chả, rau sống và chút ớt cay.","tags":["nước nôi","chắc bụng"],"price":50000,"link":"","image":"","rarity":"","off":false},
    {"id":"com-tam","name":"Cơm tấm","emoji":"🍚","desc":"Cơm tấm ăn cùng sườn nướng thơm lừng, đồ chua và nước mắm chua ngọt.","tags":["chắc bụng","khô"],"price":45000,"link":"","image":"","rarity":"","off":false},
    {"id":"bun-cha-ha-noi","name":"Bún chả Hà Nội","emoji":"🍖","desc":"Thịt nướng thơm, chả viên đậm vị, ăn kèm bún tươi, rau sống và nước mắm pha.","tags":["khô","chắc bụng"],"price":50000,"link":"","image":"","rarity":"","off":false},
    {"id":"com-ga","name":"Cơm gà","emoji":"🍗","desc":"Cơm thơm dẻo, thịt gà mềm ngọt, ăn kèm rau và nước chấm đặc trưng.","tags":["chắc bụng","khô"],"price":50000,"link":"","image":"","rarity":"","off":false},
    {"id":"bun-mang-ga","name":"Bún măng gà","emoji":"🍲","desc":"Nước dùng gà thanh ngọt, măng giòn, thịt gà mềm và bún tươi nóng hổi.","tags":["nước nôi","chắc bụng"],"price":40000,"link":"","image":"","rarity":"","off":false},
    {"id":"com-bo","name":"Cơm bò","emoji":"🥩","desc":"Cơm nóng ăn cùng thịt bò đậm vị, mềm thơm, phù hợp cho bữa trưa no bụng.","tags":["chắc bụng","khô"],"price":50000,"link":"","image":"","rarity":"","off":false},
    {"id":"bun-cha-ca","name":"Bún chả cá","emoji":"🐟","desc":"Chả cá dai thơm, nước dùng thanh ngọt, thêm rau và chút ớt cho tròn vị.","tags":["nước nôi","nhẹ bụng"],"price":40000,"link":"","image":"","rarity":"","off":false},
    {"id":"com-phan-hop","name":"Cơm phần (hộp)","emoji":"🍱","desc":"Một hộp cơm đầy đủ món mặn, rau và cơm nóng, tiện lợi cho bữa trưa văn phòng.","tags":["chắc bụng","ăn nhanh"],"price":35000,"link":"","image":"","rarity":"","off":false},
    {"id":"cao-lau","name":"Cao lầu","emoji":"🍜","desc":"Sợi mì dai đặc trưng, thịt xá xíu, rau sống và bánh tráng giòn mang hương vị Hội An.","tags":["khô","chắc bụng"],"price":45000,"link":"","image":"","rarity":"","off":false},
    {"id":"bun-thai","name":"Bún Thái","emoji":"🌶️","desc":"Nước dùng chua cay thơm sả, ăn cùng bún, hải sản và rau tươi hấp dẫn.","tags":["nước nôi","cay"],"price":50000,"link":"","image":"","rarity":"","off":false},
    {"id":"banh-canh","name":"Bánh canh","emoji":"🥣","desc":"Sợi bánh canh dai mềm, nước dùng đậm đà, ăn nóng rất hợp cho một bữa no bụng.","tags":["nước nôi","chắc bụng"],"price":40000,"link":"","image":"","rarity":"","off":false}
  ],

  drink: [
    {"id":"ezi","name":"Ezi","emoji":"🧋","desc":"Ghé Ezi làm một ly nước yêu thích, nạp năng lượng cho ngày mới.","tags":["ngọt","topping"],"price":45000,"link":"","image":"","rarity":"","off":false},
    {"id":"phe-la","name":"Phê La","emoji":"🍵","desc":"Thưởng thức trà đậm vị, thơm đặc trưng, dành cho những tín đồ mê trà.","tags":["tỉnh táo","thanh mát"],"price":50000,"link":"","image":"","rarity":"","off":false},
    {"id":"drinklab","name":"DrinkLab","emoji":"🧪","desc":"Khám phá những công thức đồ uống thú vị, đổi vị cho ngày thường thêm vui.","tags":["ngọt","topping"],"price":40000,"link":"","image":"","rarity":"","off":false},
    {"id":"katinat","name":"Katinat","emoji":"🥤","desc":"Thưởng thức đồ uống hấp dẫn trong không gian hiện đại, hợp để chill cùng bạn bè.","tags":["ngọt","topping"],"price":50000,"link":"","image":"","rarity":"","off":false},
    {"id":"amor","name":"Amor","emoji":"💗","desc":"Một chút ngọt ngào từ Amor, lựa chọn dễ thương cho buổi hẹn cà phê.","tags":["ngọt","thanh mát"],"price":40000,"link":"","image":"","rarity":"","off":false},
    {"id":"tuc-tac","name":"Túc Tắc","emoji":"🍹","desc":"Dừng chân một chút, chọn ly nước hợp gu rồi tiếp tục hành trình.","tags":["thanh mát","rẻ"],"price":30000,"link":"","image":"","rarity":"","off":false},
    {"id":"highlands","name":"Highlands","emoji":"☕","desc":"Cà phê quen thuộc, đậm vị, lựa chọn lý tưởng để tỉnh táo làm việc.","tags":["tỉnh táo","ngọt"],"price":40000,"link":"","image":"","rarity":"","off":false},
    {"id":"salus","name":"Salus","emoji":"🌿","desc":"Đổi gió với một lựa chọn đồ uống nhẹ nhàng, làm mới tinh thần.","tags":["thanh mát"],"price":35000,"link":"","image":"","rarity":"","off":false},
    {"id":"vintea","name":"Vintea","emoji":"🍃","desc":"Một ly trà thơm mát, phù hợp cho những lúc muốn thư giãn.","tags":["thanh mát","topping"],"price":35000,"link":"","image":"","rarity":"","off":false},
    {"id":"tabtea","name":"TabTea","emoji":"🧋","desc":"Chọn món trà yêu thích, thêm topping để ly nước đúng gu của bạn.","tags":["ngọt","topping"],"price":35000,"link":"","image":"","rarity":"","off":false},
    {"id":"phuc-long","name":"Phúc Long","emoji":"🍵","desc":"Hương trà đậm đà, thơm đặc trưng, dành cho người yêu trà và cà phê.","tags":["tỉnh táo","thanh mát"],"price":45000,"link":"","image":"","rarity":"","off":false},
    {"id":"no","name":"Nờ","emoji":"🥤","desc":"Thử một lựa chọn mới, biết đâu lại tìm được món nước chân ái.","tags":["ngọt","thanh mát"],"price":35000,"link":"","image":"","rarity":"","off":false},
    {"id":"heyday","name":"HeyDay","emoji":"✨","desc":"Thêm chút hứng khởi cho ngày hôm nay với một ly nước yêu thích.","tags":["ngọt","topping"],"price":40000,"link":"","image":"","rarity":"","off":false},
    {"id":"juice-joy","name":"Juice&Joy","emoji":"🍊","desc":"Nạp chút tươi mát với những lựa chọn nước ép và đồ uống trái cây.","tags":["thanh mát","no bụng"],"price":35000,"link":"","image":"","rarity":"","off":false},
    {"id":"rau-ma-pha","name":"Rau má pha","emoji":"🥬","desc":"Rau má mát lành, lựa chọn dân dã cho ngày nóng và những lúc cần giải nhiệt.","tags":["thanh mát","rẻ"],"price":25000,"link":"","image":"","rarity":"","off":false}
  ]
};
