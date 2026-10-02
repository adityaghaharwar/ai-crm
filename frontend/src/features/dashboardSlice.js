import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api";
import { fetchTasks } from "./tasksSlice";

export const fetchDashboard = createAsyncThunk("dashboard/fetch", () => api.get("/dashboard"));

export const runSweep = createAsyncThunk("dashboard/sweep", async (_, { dispatch }) => {
  const result = await api.post("/automation/run");
  dispatch(fetchTasks());
  dispatch(fetchDashboard());
  return result.created;
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: { data: null, status: "idle", error: null, lastSweep: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchDashboard.pending, (s) => {
      s.status = "loading";
    });
    b.addCase(fetchDashboard.fulfilled, (s, a) => {
      s.status = "ready";
      s.data = a.payload;
      s.error = null;
    });
    b.addCase(fetchDashboard.rejected, (s, a) => {
      s.status = "failed";
      s.error = a.error.message;
    });
    b.addCase(runSweep.fulfilled, (s, a) => {
      s.lastSweep = a.payload;
    });
  },
});

export default dashboardSlice.reducer;
