import { createSlice } from "@reduxjs/toolkit";
import { appActions } from "app/app.reducer";
import { todolistsThunks } from "features/todolists-list/todolists/model/todolists.slice";
import { taskAPI } from "features/todolists-list/tasks/api/tasks.api";
import { createAppAsyncThunk } from "common/utils";
import { ResultCode } from "common/enums";
import { clearTasksAndTodolists } from "common/actions";
import {
  AddTaskArgType,
  ChangeTasksOrderArgType,
  RemoveTaskArgType,
  TaskType,
  UpdateTaskArgType,
  UpdateTaskModelType
} from "features/todolists-list/tasks/api/tasks.api.types";

const fetchTasks = createAppAsyncThunk<{ tasks: TaskType[]; todolistId: string }, string>(
  "tasks/fetchTasks",
  async (todolistId) => {
    const res = await taskAPI.getTasks(todolistId);
    const tasks = res.data.items;
    return { tasks, todolistId };
  }
);

const addTask = createAppAsyncThunk<{ task: TaskType }, AddTaskArgType>(
  "tasks/addTask",
  async (arg, thunkAPI) => {
    const { rejectWithValue } = thunkAPI;
    const res = await taskAPI.createTask(arg);
    if (res.data.resultCode === ResultCode.Success) {
      const task = res.data.data.item;
      return { task };
    } else {
      return rejectWithValue({ data: res.data, showGlobalError: false });
    }
  });


const changeTasksOrder = createAppAsyncThunk<ChangeTasksOrderArgType, ChangeTasksOrderArgType>(
  "tasks/changeOrder",
  async (arg, thunkAPI) => {
    const { rejectWithValue } = thunkAPI;
    const res = await taskAPI.changeTasksOrder(arg);
    if (res.data.resultCode === ResultCode.Success) {
      return arg;
    } else {
      return rejectWithValue({ data: res.data, showGlobalError: true });
    }
  });

const updateTask = createAppAsyncThunk<UpdateTaskArgType, UpdateTaskArgType>(
  "tasks/updateTask",
  async (arg, thunkAPI) => {
    const { dispatch, rejectWithValue, getState } = thunkAPI;
    const state = getState();
    const task = state.tasks[arg.todolistId].find((t) => t.id === arg.taskId);
    if (!task) {
      dispatch(appActions.setAppError({ error: "task not found in the state" }));
      return rejectWithValue(null);
    }

    const apiModel: UpdateTaskModelType = {
      deadline: task.deadline,
      description: task.description,
      priority: task.priority,
      startDate: task.startDate,
      title: task.title,
      status: task.status,
      ...arg.domainModel
    };

    const res = await taskAPI.updateTask(arg.todolistId, arg.taskId, apiModel);
    if (res.data.resultCode === ResultCode.Success) {
      return arg;
    } else {
      return rejectWithValue({ data: res.data, showGlobalError: true });
    }
  }
);


const removeTask = createAppAsyncThunk<RemoveTaskArgType, RemoveTaskArgType>(
  "tasks/removeTask",
  async (arg, thunkAPI) => {
    const { rejectWithValue } = thunkAPI;
    const res = await taskAPI.deleteTask(arg);
    if (res.data.resultCode === ResultCode.Success) {
      return arg;
    } else {
      return rejectWithValue({ data: res.data, showGlobalError: true });
    }
  }
);

const initialState: TasksStateType = {};

const slice = createSlice({
  name: "tasks",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state[action.payload.todolistId] = action.payload.tasks;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        const tasks = state[action.payload.task.todoListId];
        tasks.unshift(action.payload.task);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const tasks = state[action.payload.todolistId];
        const index = tasks.findIndex((t) => t.id === action.payload.taskId);
        if (index !== -1) {
          tasks[index] = { ...tasks[index], ...action.payload.domainModel };
        }
      })
      .addCase(removeTask.fulfilled, (state, action) => {
        const tasks = state[action.payload.todolistId];
        const index = tasks.findIndex((t) => t.id === action.payload.taskId);
        if (index !== -1) tasks.splice(index, 1);
      })
      .addCase(changeTasksOrder.fulfilled, (state, action) => {
        const tasks = state[action.payload.todolistId];
        const indexMovedTask = tasks.findIndex((t) => t.id === action.payload.taskId);
        const indexAfterTask = tasks.findIndex((t) => t.id === action.payload.putAfterItemId);

        const [movedTask] = tasks.splice(indexMovedTask, 1);
        tasks.splice(indexAfterTask + 1, 0, movedTask);

      })
      .addCase(todolistsThunks.addTodolist.fulfilled, (state, action) => {
        state[action.payload.todolist.id] = [];
      })
      .addCase(todolistsThunks.removeTodolist.fulfilled, (state, action) => {
        delete state[action.payload.id];
      })
      .addCase(todolistsThunks.fetchTodolists.fulfilled, (state, action) => {
        action.payload.todolists.forEach((tl) => {
          state[tl.id] = [];
        });
      })
      .addCase(clearTasksAndTodolists, () => {
        return {};
      });
  }
});

export const tasksSlice = slice.reducer;
export const tasksThunks = { fetchTasks, addTask, updateTask, removeTask, changeTasksOrder };

export type TasksStateType = Record<string, TaskType[]>
