'use client';

import Footer from '@/components/footer';
import { motion } from 'framer-motion';

const sectionVariant = {
  hidden: { opacity: 0, y: 25 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export default function UserClient() {
  return (
    <>
      <div className="profile mx-auto space-y-[38px] px-[16px] md:max-w-7xl">
        <motion.div
          custom={0}
          variants={sectionVariant}
          initial="hidden"
          animate="show"
        >
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
          <motion.button
            className="btn_outline"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Save Password
          </motion.button>
        </motion.div>

        <motion.div
          custom={1}
          variants={sectionVariant}
          initial="hidden"
          animate="show"
        >
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
          <motion.button
            className="btn_outline"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Save Changes
          </motion.button>
        </motion.div>

        <motion.div
          custom={2}
          variants={sectionVariant}
          initial="hidden"
          animate="show"
        >
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

          <motion.button
            className="btn_outline"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Save Changes
          </motion.button>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}
