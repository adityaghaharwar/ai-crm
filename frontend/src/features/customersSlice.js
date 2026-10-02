import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api";
import { fetchDashboard } from "./dashboardSlice";
import { fetchDeals } from "./dealsSlice";
import { fetchTasks } from "./tasksSlice";

const refresh = (dispatch) => {
  dispatch(fetchTasks());
  dispatch(fetchDeals());
  dispatch(fetchDashboard());
};

export const fetchCustomers = createAsyncThunk("customers/fetch", (search = "") =>
  api.get(`/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`)
);

export const addCustomer = createAsyncThunk("customers/add", async (body, { dispatch }) => {
  const customer = await api.post("/customers", body);
  refresh(dispatch);
  return customer;
});

export const removeCustomer = createAsyncThunk("customers/remove", async (id, { dispatch }) => {
  await api.del(`/customers/${id}`);
  refresh(dispatch);
  return id;
});

export const fetchInsight = createAsyncThunk("customers/insight", async (id) => ({
  id,
  ...(await api.post(`/customers/${id}/insight`)),
}));

const customersSlice = createSlice({
  name: "customers",
  initialState: { items: [], insights: {}, status: "idle", error: null },
  reducers: {
    clearError(s) {
      s.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchCustomers.pending, (s) => {
      s.status = "loading";
    });
    b.addCase(fetchCustomers.fulfilled, (s, a) => {
      s.status = "ready";
      s.items = a.payload;
    });
    b.addCase(fetchCustomers.rejected, (s, a) => {
      s.status = "failed";
      s.error = a.error.message;
    });
    b.addCase(addCustomer.fulfilled, (s, a) => {
      s.items.unshift(a.payload);
      s.error = null;
    });
    b.addCase(addCustomer.rejected, (s, a) => {
      s.error = a.error.message;
    });
    b.addCase(removeCustomer.fulfilled, (s, a) => {
      s.items = s.items.filter((c) => c.id !== a.payload);
      delete s.insights[a.payload];
    });
    b.addCase(fetchInsight.fulfilled, (s, a) => {
      s.insights[a.payload.id] = { text: a.payload.insight, source: a.payload.source };
    });
  },
});

export const { clearError } = customersSlice.actions;
export default customersSlice.reducer;
