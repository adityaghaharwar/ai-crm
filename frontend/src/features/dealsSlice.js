import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api";
import { fetchDashboard } from "./dashboardSlice";
import { fetchTasks } from "./tasksSlice";

const refresh = (dispatch) => {
  dispatch(fetchTasks());
  dispatch(fetchDashboard());
};

export const fetchDeals = createAsyncThunk("deals/fetch", () => api.get("/deals"));

export const addDeal = createAsyncThunk("deals/add", async (body, { dispatch }) => {
  const deal = await api.post("/deals", body);
  refresh(dispatch);
  return deal;
});

export const moveDeal = createAsyncThunk("deals/move", async ({ id, stage }, { dispatch }) => {
  const deal = await api.patch(`/deals/${id}/stage`, { stage });
  refresh(dispatch);
  return deal;
});

export const removeDeal = createAsyncThunk("deals/remove", async (id, { dispatch }) => {
  await api.del(`/deals/${id}`);
  refresh(dispatch);
  return id;
});

const dealsSlice = createSlice({
  name: "deals",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDeals.pending, (s) => {
      s.status = "loading";
    });
    b.addCase(fetchDeals.fulfilled, (s, a) => {
      s.status = "ready";
      s.items = a.payload;
    });
    b.addCase(fetchDeals.rejected, (s, a) => {
      s.status = "failed";
      s.error = a.error.message;
    });
    b.addCase(addDeal.fulfilled, (s, a) => {
      s.items.unshift(a.payload);
      s.error = null;
    });
    b.addCase(addDeal.rejected, (s, a) => {
      s.error = a.error.message;
    });
    b.addCase(moveDeal.fulfilled, (s, a) => {
      const i = s.items.findIndex((d) => d.id === a.payload.id);
      if (i >= 0) s.items[i] = a.payload;
    });
    b.addCase(removeDeal.fulfilled, (s, a) => {
      s.items = s.items.filter((d) => d.id !== a.payload);
    });
  },
});

export default dealsSlice.reducer;
