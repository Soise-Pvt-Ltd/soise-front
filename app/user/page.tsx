import Nav from '@/components/nav';
import Footer from '@/components/footer';

export default function UserPage() {
  return (
    <>
      <Nav />
      <div className="profile mx-auto space-y-[38px] px-[16px] md:max-w-7xl">
        <div>
          <h1 className="text-[16px] uppercase">Account Management</h1>
          <div className="mt-[24px] mb-[18px] space-y-[10px]">
            <div>
              <label>Old passsword</label>
              <input type="password" className="solid" placeholder="✱✱✱✱✱✱✱✱" />
            </div>
            <div>
              <label>New password</label>
              <input type="password" className="solid" placeholder="✱✱✱✱✱✱✱✱" />
            </div>
          </div>
          <button className="btn_outline">Save Password</button>
        </div>

        <div>
          <h1 className="text-[16px] uppercase">Profile Information</h1>
          <div className="mt-[24px] mb-[18px] space-y-[10px]">
            <div>
              <label>Username</label>
              <input type="text" className="solid" placeholder="the.boy" />
            </div>
            <div>
              <label>Firstname</label>
              <input type="text" className="solid" placeholder="John" />
            </div>
            <div>
              <label>Lastname</label>
              <input type="text" className="solid" placeholder="Sosie" />
            </div>
            <div>
              <label>Email</label>
              <input
                type="text"
                className="solid"
                placeholder="boy@example.com"
              />
            </div>
            <div>
              <label>Address</label>
              <input
                type="text"
                className="solid"
                placeholder="#1 Sosie Town"
              />
            </div>
          </div>
          <button className="btn_outline">Save Changes</button>
        </div>

        <div>
          <h1 className="text-[16px] uppercase">Delivery</h1>
          <div className="mt-[24px] mb-[18px] space-y-[10px] py-[20px]">
            <select className="solid">
              <option>Nigeria</option>
            </select>
            <input type="text" className="solid" placeholder="Address" />
            <input type="text" className="solid" placeholder="City" />
            <input type="text" className="solid" placeholder="State" />
            <input type="text" className="solid" placeholder="ZIP code" />
            <input type="text" className="solid" placeholder="Phone" />
          </div>

          <button className="btn_outline">Save Changes</button>
        </div>
      </div>
      <Footer />
    </>
  );
}
