// Public shape of a user; never exposes password, dob or tenant internals.
export function serializeUser(user, origin) {
    const source = typeof user.toObject === "function" ? user.toObject() : user;
    return {
        _id: String(source._id),
        user: source.user,
        name: source.name,
        email: source.email,
        phone: source.phone,
        sex: source.sex,
        timezone: source.timezone,
        age: source.age?.years,
        dob:source.dob.toISOString().split("T")[0],
        profilePicture: source.profilePicture,
        role: source.role,
        organization: origin,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt
    };
}
