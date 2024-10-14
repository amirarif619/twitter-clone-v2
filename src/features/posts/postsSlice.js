import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { db, storage } from "../../firebase";
import { collection, getDocs, getDoc, setDoc, updateDoc, doc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

// Fetch user's posts
export const fetchPostsByUser = createAsyncThunk(
    "posts/fetchByUser",
    async (userId) => {
        try {
            const postsRef = collection(db, `users/${userId}/posts`);
            const querySnapshot = await getDocs(postsRef);
            const docs = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            return docs;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
);

// Save a new post
export const savePost = createAsyncThunk(
    "posts/savePost",
    async ({ userId, postContent, file }) => {
        try {
            const imageRef = ref(storage, `posts/${file.name}`)
            const response = await uploadBytes(imageRef, file);
            const imageUrl = await getDownloadURL(response.ref);
            const postsRef = collection(db, `users/${userId}/posts`);
            const newPostRef = doc(postsRef); 
            await setDoc(newPostRef, { content: postContent, likes: [], imageUrl });
            const newPost = await getDoc(newPostRef);
            return {
                id: newPost.id,
                ...newPost.data(),
            };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
);

// Like a post
export const likePost = createAsyncThunk(
    "posts/likePost",
    async ({ userId, postId }) => {
        try {
            const postRef = doc(db, `users/${userId}/posts/${postId}`);
            const docSnap = await getDoc(postRef);

            if (docSnap.exists()) {
                const postData = docSnap.data();
                const likes = postData.likes ? [...postData.likes, userId] : [userId]; 
                await updateDoc(postRef, { likes });
            }

            return { userId, postId };
        } catch (error) {
            console.error("Error liking post: ", error);
            throw error;
        }
    }
);

// Remove like from post
export const removeLikeFromPost = createAsyncThunk(
    "posts/removeLikeFromPost",
    async ({ userId, postId }) => {
        try {
            const postRef = doc(db, `users/${userId}/posts/${postId}`);
            const docSnap = await getDoc(postRef);

            if (docSnap.exists()) {
                const postData = docSnap.data();
                const likes = postData.likes ? postData.likes.filter((id) => id !== userId) : []; 
                await updateDoc(postRef, { likes });
            }

            return { userId, postId };
        } catch (error) {
            console.error("Error removing like: ", error);
            throw error;
        }
    }
);

// Posts slice
const postsSlice = createSlice({
    name: "posts",
    initialState: { posts: [], loading: true },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPostsByUser.fulfilled, (state, action) => {
                state.posts = action.payload;
                state.loading = false;
            })
            .addCase(savePost.fulfilled, (state, action) => {
                state.posts = [action.payload, ...state.posts];
            })
            .addCase(likePost.fulfilled, (state, action) => {
                const { userId, postId } = action.payload;
                const postIndex = state.posts.findIndex((post) => post.id === postId);

                if (postIndex !== -1) {
                    state.posts[postIndex].likes.push(userId);
                }
            })
            .addCase(removeLikeFromPost.fulfilled, (state, action) => {
                const { userId, postId } = action.payload;
                const postIndex = state.posts.findIndex((post) => post.id === postId);

                if (postIndex !== -1) {
                    state.posts[postIndex].likes = state.posts[postIndex].likes.filter(
                        (id) => id !== userId
                    );
                }
            });
    },
});

export default postsSlice.reducer;
