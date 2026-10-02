import { configureStore } from "@reduxjs/toolkit";
import customers from "./features/customersSlice";
import deals from "./features/dealsSlice";
import tasks from "./features/tasksSlice";
import dashboard from "./features/dashboardSlice";

export const store = configureStore({
  reducer: { customers, deals, tasks, dashboard },
});
