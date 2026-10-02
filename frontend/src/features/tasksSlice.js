import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api";
import { fetchDashboard } from "./dashboardSlice";

export const fetchTasks = createAsyncThunk("tasks/fetch", () => api.get("/tasks"));

export const addTask = createAsyncThunk("tasks/add", async (body, { dispatch }) => {
  const task = await api.post("/tasks", body);
  dispatch(fetchTasks());
  dispatch(fetchDashboard());
  return task;
});

export const toggleTask = createAsyncThunk("tasks/toggle", async ({ id, done }, { dispatch }) => {
  const task = await api.patch(`/tasks/${id}`, { done });
  dispatch(fetchDashboard());
  return task;
});

export const removeTask = createAsyncThunk("tasks/remove", async (id, { dispatch }) => {
  await api.del(`/tasks/${id}`);
  dispatch(fetchDashboard());
  return id;
});

const tasksSlice = createSlice({
  name: "tasks",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTasks.pending, (s) => {
      s.status = "loading";
    });
    b.addCase(fetchTasks.fulfilled, (s, a) => {
      s.status = "ready";
      s.items = a.payload;
    });
    b.addCase(fetchTasks.rejected, (s, a) => {
      s.status = "failed";
      s.error = a.error.message;
    });
    b.addCase(toggleTask.fulfilled, (s, a) => {
      const i = s.items.findIndex((t) => t.id === a.payload.id);
      if (i >= 0) s.items[i] = a.payload;
    });
    b.addCase(removeTask.fulfilled, (s, a) => {
      s.items = s.items.filter((t) => t.id !== a.payload);
    });
    b.addCase(addTask.rejected, (s, a) => {
      s.error = a.error.message;
    });
  },
});

export default tasksSlice.reducer;
