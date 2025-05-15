export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  return new Date(dateString).toLocaleDateString("hr-HR", options);
};

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

export const formatStatus = (status) => {
  const statusMap = {
    pending: "Na čekanju",
    paid: "Plaćeno",
    partially_paid: "Djelomično plaćeno",
    delivered: "Isporučeno",
    cancelled: "Otkazano",
    not_shipped: "Nije poslano",
    shipped: "Poslano",
  };
  return statusMap[status] || status;
};
