import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const BASE_URL = "https://a6c1c793-b5eb-486f-bcce-0645000e22d3-00-3p9zufmgouiqu.pike.replit.dev"

//Async thunk for fetching a user's posts
export const fetchPostsByUser = createAsyncThunk(
    "posts/fetchByUser",
    async (userId) => {
        const response = await fetch(`${BASE_URL}/posts/user/${userId}`);
        return response.json();
    }
);

//Slice
const postsSlice = createSlice({
    name: "posts",
    initialState: { posts: [], loading: true},
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchPostsByUser.fulfilled, (state, action) => {
            state.posts = action.payload;
            state.loading = false;
        });
    },
});

export default postsSlice.reducer;