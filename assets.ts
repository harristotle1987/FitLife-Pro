/**
 * Centralized Asset Store
 * Optimized with width and format parameters for high-performance loading.
 */

const base = (id: string, w: number) => `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop&fm=webp`;

// Core Brand Images
export const hero_bg = base("photo-1534438327276-14e5300c3a48", 1600);
export const about_main = base("photo-1571019613454-1cb2f99b2d8b", 800);
export const about_texture = base("photo-1517836357463-d25dfeac3438", 800);
export const nutrition_main = base("photo-1512621776951-a57141f2eefd", 800);
export const contact_bg = base("photo-1599058945522-28d584b6f0ff", 1200);
export const ai_avatar = base("photo-1560250097-0b93528c311a", 400);

// Training Plan Images
export const plan_starter = base("photo-1517836357463-d25dfeac3438", 600);
export const plan_performance = base("photo-1583454110551-21f2fa2afe61", 600);
export const plan_executive = base("photo-1571019614242-c5c5dee9f50b", 600);
export const plan_pinnacle = base("photo-1534438327276-14e5300c3a48", 600);

// Facility Gallery Images
export const fac_iron = base("photo-1541534741688-6078c6bfb5c5", 800);
export const fac_cardio = base("photo-1540497077202-7c8a3999166f", 800);
export const fac_recovery = base("photo-1593079831268-3381b0db4a77", 800);
export const fac_turf = base("photo-1552674605-db6ffd4facb5", 800);
export const fac_zen = base("photo-1544367567-0f2fcb009e0b", 800);
export const fac_octagon = base("photo-1590556409324-aa1d726e5c3c", 800);

// The Squad (Team) Images
export const team_cesar = base("photo-1534438327276-14e5300c3a48", 400);
export const team_elena = base("photo-1583454110551-21f2fa2afe61", 400);
export const team_marcus = base("photo-1541534741688-6078c6bfb5c5", 400);
export const team_sarah = base("photo-1552196563-55cd4e45efb3", 400);
export const team_julian = base("photo-1594824476967-48c8b964273f", 400);
export const team_maya = base("photo-1620188467120-5042ed1eb5da", 400);
export const team_leo = base("photo-1595078475328-1ab05d0a6a0e", 400);
export const team_isabella = base("photo-1599447421416-3414500d18a5", 400);
export const team_jackson = base("photo-1605296867304-46d5465a13f1", 400);