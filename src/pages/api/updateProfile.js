import pb from "../../utils/pb";

export const POST = async ({ request, cookies }) => {
    try {
        // Get current user from cookie
        const authCookie = cookies.get('pb_auth');
        if (!authCookie) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    message: "Not authenticated" 
                }), 
                { 
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        const authData = JSON.parse(authCookie.value);
        const userId = authData.model?.id;

        if (!userId) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    message: "User ID not found" 
                }), 
                { 
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        // Get form data
        const formData = await request.formData();
        
        const name = formData.get('name');
        const email = formData.get('email');
        const avatar = formData.get('avatar');
        const oldPassword = formData.get('oldPassword');
        const password = formData.get('password');
        const passwordConfirm = formData.get('passwordConfirm');

        // Prepare update data
        const updateData = new FormData();
        
        if (name) {
            updateData.append('name', name);
        }
        
        if (email) {
            updateData.append('email', email);
        }
        
        if (avatar && avatar.size > 0) {
            updateData.append('avatar', avatar);
        }
        
        // Handle password change
        if (password && passwordConfirm) {
            if (password !== passwordConfirm) {
                return new Response(
                    JSON.stringify({ 
                        success: false, 
                        message: "Passwords do not match" 
                    }), 
                    { 
                        status: 400,
                        headers: { "Content-Type": "application/json" }
                    }
                );
            }
            
            updateData.append('password', password);
            updateData.append('passwordConfirm', passwordConfirm);
            
            if (oldPassword) {
                updateData.append('oldPassword', oldPassword);
            }
        }

        // Update user in PocketBase
        const record = await pb.collection('users').update(userId, updateData);

        console.log("User profile updated:", record.id);

        // Update the auth cookie with new user data
        const newAuthData = {
            ...authData,
            model: record
        };
        
        cookies.set('pb_auth', JSON.stringify(newAuthData), {
            path: '/',
            httpOnly: false,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return new Response(
            JSON.stringify({ 
                success: true, 
                message: "Profile updated successfully",
                user: record
            }), 
            { 
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        );
    } catch (error) {
        console.error("Error updating profile:", error);
        
        return new Response(
            JSON.stringify({ 
                success: false, 
                message: error.message || "Error updating profile" 
            }), 
            { 
                status: 500,
                headers: { "Content-Type": "application/json" }
            }
        );
    }
};
