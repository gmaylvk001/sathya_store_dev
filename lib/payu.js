import crypto from "crypto";

/**
 * PayU Configuration for Unilet Karnataka Orders
 */
export const getPayuConfig = () => {
  const mode = (process.env.PAYU_MODE || "test").toLowerCase();
  const isLive = mode === "live" || mode === "production";

  // Official PayU test credentials fallback if not defined in .env
  const key =
    process.env.PAYU_MERCHANT_KEY ||
    process.env.NEXT_PUBLIC_PAYU_KEY ||
    "gtKFFx";
  const salt = process.env.PAYU_MERCHANT_SALT || "eCwWELxi";

  const actionUrl = isLive
    ? "https://secure.payu.in/_payment"
    : "https://test.payu.in/_payment";

  return { key, salt, actionUrl, isLive };
};

/**
 * Generate SHA-512 Hash for PayU payment request
 * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
 */
export const generatePayuHash = ({
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  udf1 = "",
  udf2 = "",
  udf3 = "",
  udf4 = "",
  udf5 = "",
}) => {
  const { key, salt } = getPayuConfig();

  const formattedAmount = parseFloat(amount).toFixed(2);
  const cleanProductInfo = String(productinfo || "Sathya Unilet Purchase").replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 100);
  const cleanFirstName = String(firstname || "Customer").trim();
  const cleanEmail = String(email || "customer@example.com").trim();

  const hashString = `${key}|${txnid}|${formattedAmount}|${cleanProductInfo}|${cleanFirstName}|${cleanEmail}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;

  const hash = crypto.createHash("sha512").update(hashString).digest("hex");
  return { hash, formattedAmount, cleanProductInfo, cleanFirstName, cleanEmail, key };
};

/**
 * Verify SHA-512 Hash returned by PayU in callback/webhook
 * If additionalCharges:
 *   sha512(additionalCharges|salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * Else:
 *   sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export const verifyPayuHash = (params) => {
  const { salt } = getPayuConfig();

  const {
    key = "",
    txnid = "",
    amount = "",
    productinfo = "",
    firstname = "",
    email = "",
    status = "",
    hash = "",
    additionalCharges = "",
    udf1 = "",
    udf2 = "",
    udf3 = "",
    udf4 = "",
    udf5 = "",
  } = params;

  let hashSequence = "";
  if (additionalCharges) {
    hashSequence = `${additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  } else {
    hashSequence = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  }

  const computedHash = crypto
    .createHash("sha512")
    .update(hashSequence)
    .digest("hex")
    .toLowerCase();

  const isValid = computedHash === String(hash || "").toLowerCase();
  return { isValid, computedHash, receivedHash: hash };
};
