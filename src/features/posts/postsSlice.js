import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { db, storage } from "../../firebase";
import { 
    collection, 
    getDocs, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    doc } from "firebase/firestore";
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
            let imageUrl = "";
            console.log(file);
            if (file !== null) {
            const imageRef = ref(storage, `posts/${file.name}`)
            const response = await uploadBytes(imageRef, file);
            imageUrl = await getDownloadURL(response.ref);
            }
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



// Update post
export const updatePost = createAsyncThunk(
    "posts/updatePost",
    async ({ userId, postId, newPostContent, newFile }) => {
        try {
            let newImageUrl;
            if (newFile) {
            const imageRef = ref(storage, `posts/${newFile.name}`)
            const response = await uploadBytes(imageRef, newFile);
            newImageUrl = await getDownloadURL(response.ref);
            }

            const postRef = doc(db, `users/${userId}/posts/${postId}`);
            const postSnap = await getDoc(postRef);

            if (postSnap.exists()) {
                const postData = postSnap.data();

                const updatedData = {
                    ...postData,
                    content: newPostContent || postData.content,
                    imageUrl: newImageUrl || postData.imageUrl,
                }

                await updateDoc(postRef, updatedData);

                const updatedPost = { id: postId, ...updatedData };
                return updatedPost;
            } else {
                throw new Error("Post does not exist");
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
);

//Delete post

export const deletePost = createAsyncThunk(
    "posts/deletePost",
    async ({ userId, postId }) => {
        try {
            const postRef = doc(db, `users/${userId}/posts/${postId}`);
            await deleteDoc(postRef);

            return postId;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
)

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
            })
            .addCase(updatePost.fulfilled, (state, action) => {
                const updatedPost = action.payload;

                const postIndex = state.posts.findIndex(
                    (post) => post.id === updatedPost.id
                );
                if (postIndex !== -1) {
                    state.posts[postIndex] = updatedPost;
                }
            })
            .addCase(deletePost.fulfilled, (state,action) => {
                const deletedPostId = action.payload;
                state.posts = state.posts.filter((post) => post.id !== deletedPostId);
            })
    },
});

export default postsSlice.reducer;
