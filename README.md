# คลังบทแปลส่วนตัว (PWA)

เว็บแอปนี้เก็บบทแปลและค่าการอ่านไว้ใน IndexedDB ของเบราว์เซอร์ ไม่มี API key และไม่มีโค้ดส่งบทแปลออกไปยังบริการภายนอก รูปจาก URL ภายนอกใน HTML จะไม่ถูกโหลดอัตโนมัติ ส่วนรูปที่ฝังมาในไฟล์สำรองยังแสดงได้

## ติดตั้งบน iPhone

1. โฮสต์ไฟล์ชุดนี้ผ่าน HTTPS
2. เปิด URL ใน Safari แล้วกดปุ่มแชร์ → **เพิ่มไปยังหน้าจอโฮม**
3. เปิดแอปจากไอคอน แล้วเลือก **นำเข้าไฟล์สำรอง**
4. เลือกไฟล์ JSON ที่ได้จากปุ่ม **สำรอง/ย้ายข้อมูล** ของส่วนขยาย แล้วเลือก **รวมกับข้อมูลเดิม** หรือ **แทนที่บทและตารางคำอ่าน**

หลังเปิดครั้งแรก ให้รอให้เว็บโหลดครบก่อนใช้งานออฟไลน์ ไฟล์แอป สไตล์ สคริปต์ ไอคอน และฟอนต์จะถูกเก็บใน Cache Storage; บทแปลและตารางคำอ่านจะอยู่ใน IndexedDB บนอุปกรณ์นั้น

## GitHub Pages

เพื่อไม่เผยไฟล์ของส่วนขยาย ให้สร้าง repository แยกที่มีเฉพาะเนื้อหาในโฟลเดอร์ `mobile-reader/` (วาง `index.html`, `app.js` และไฟล์ประกอบไว้ที่ root ของ repository) จากนั้นเปิด **Settings → Pages → Build and deployment**, เลือก **Deploy from a branch**, เลือก `main` และ `/(root)`, แล้วกด **Save**. เปิด URL HTTPS ที่ Pages แสดงใน Safari.

ถ้าเก็บ PWA ไว้ใน repository อื่นใต้ path `mobile-reader/`, ต้องตั้ง workflow ให้ deploy เนื้อหาในโฟลเดอร์นี้เป็น artifact ของ Pages; การเลือก `/root` จาก branch จะไม่เผยแพร่โฟลเดอร์ย่อยโดยตรง

**ความเป็นส่วนตัว:** การตั้ง repository เป็น private ไม่ได้ทำให้ URL ของ GitHub Pages เป็นส่วนตัวโดยอัตโนมัติในแผนทั่วไป หน้า Pages อาจเปิดให้คนทั่วไปเข้าถึงได้ แม้ repository เป็น private ขึ้นอยู่กับแผนและการตั้งค่า Pages ดังนั้นแยก repository เฉพาะ PWA และอย่า commit ไฟล์สำรอง JSON หรือบทแปลลง GitHub ตรวจ setting ความเป็นส่วนตัวของ Pages ก่อนเผยแพร่

ดู [การตั้งค่าแหล่งเผยแพร่ GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) และ [การเปลี่ยนการมองเห็นของ GitHub Pages](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site)
