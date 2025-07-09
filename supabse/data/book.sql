INSERT INTO books (
    id, admin_id, 
    name, short_name, 
    description, 
    cover,
    slug, duration_days, message_heading, 
    message_description, 
    heading,
    farewell,
    daily_journal_points, weekly_journal_points, daily_action_points, weekly_action_points) VALUES 
('7215727d-cefa-460e-a5a0-478ec1002d08', NULL, 
'The Date Zero Gratitude', 'Date Zero',
'<p>Dear Friend,<p/><p>We are Garin and Yesi, and we are thrilled to welcome you to the DATE ZERO Gratitude Journal. Over the past few years, we have dedicated our lives to developing routines and practices that have helped us navigate through challenging times and build a mindset and rituals that allow us to thrive in any environment.<p/><p>This journal is the culmination of our research, real-life testing, and personal experiences. It represents our commitment to helping you cultivate gratitude, deepen your self-awareness, and transform your perspective on life.<p/><p>Date Zero is not just a journal; it is the foundation upon which you will build a more resilient and fulfilling life. Think of this journal as planting a seed. Through daily practices, reflections, and actions, you will nurture this seed, allowing it to grow and flourish. This journey will prepare you for future growth, as we continue to develop additional journals and courses to support your ongoing transformation.<p/><p>To make this experience even more personal and connected, please visit our website <a href="https://gynergy.com/" target="_blank">Gynergy</a>. You can learn more about our journey, the principles behind this journal, and additional resources that can support your growth.<p/><p>Thank you for allowing us to be a part of your journey. We are excited to see the incredible impact this journal will have on your life.<p/><p>With gratitude,<p/><p>Garin & Yesi<p/>', 
'books/7215727d-cefa-460e-a5a0-478ec1002d08/cover/the-day-zero.jpg', 
'date-zero-gratitude', 45, '<h3>Your Date Zero Journey Has Started! 🎉</h3>', 
'<p>DEAR FRIEND,</p><p>Welcome to a journey like no other! Here at THE GYNERGY EFFECT, we believe in not just dreaming about your highest potential, but actively working towards it every single day. To make this journey engaging and motivating, we’ve introduced an exciting path: Climbing the Mountain of Growth. This system transforms your personal growth journey into an adventurous climb, where you can track your progress, earn rewards, and share your successes.</p>', 
'<h1>Welcome to the<br/><span>DATE ZERO</span><br>Gratitude Experience</h1>',
'<p>Dear Gynerger,</p><p>Congratulations on completing this significant chapter in your journey of selfdiscovery and transformation! Finishing this journal is a testament to your commitment, dedication, and determination to create a life of purpose and fulfillment. You’ve taken important steps toward becoming your highest self, and for that, we celebrate you.</p><p>As you reflect on your journey, remember that this is just the beginning. The insights and habits you’ve developed here are the foundation for continued growth, and we’re honored to have been a part of your progress.</p>',
5, 10, 10, 70); 


INSERT INTO book_sessions (
    id, book_id, 
    duration_days, start_date, end_date) VALUES 
('3ae42bc9-1f98-4aa3-8304-6bb75844bfd0', '7215727d-cefa-460e-a5a0-478ec1002d08', 365,
'2025-04-1T05:01:09.575028+00', '2026-04-01T08:01:09.575028+00' );

INSERT INTO session_enrollments (
    id,
    user_id,
    session_id,
    book_id,
    enrollment_date,
    morning_completion,
    morning_streak,
    evening_completion,
    evening_streak,
    gratitude_completion,
    gratitude_streak,
    weekly_reflection_completion,
    weekly_reflection_streak,
    weekly_challenge_completion,
    weekly_challenge_streak,
    created_at,
    updated_at
) VALUES
('103cea99-b460-4ff0-bc3c-565603558c7c', 'ddd3e717-db95-437b-a1d4-f8bfcc143410', '3ae42bc9-1f98-4aa3-8304-6bb75844bfd0','7215727d-cefa-460e-a5a0-478ec1002d08', '2025-03-01T16:45:26.778325+00:00', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-02-26T16:45:26.778325+00:00', '2025-02-26T16:45:26.778325+00:00'),
('b5a039be-2035-422d-903d-feb42dbadc2c', '34f5f389-2ce6-452c-9d94-e4899349318a', '3ae42bc9-1f98-4aa3-8304-6bb75844bfd0','7215727d-cefa-460e-a5a0-478ec1002d08', '2025-03-02T16:45:26.778325+00:00', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-02-27T06:52:26.780352+00:00', '2025-02-27T06:52:26.780352+00:00'),
('f792a61c-423a-4bbe-8325-5e91e3d9ec73', '9e9534df-be8b-4496-af67-d24ca0e674a0', '3ae42bc9-1f98-4aa3-8304-6bb75844bfd0','7215727d-cefa-460e-a5a0-478ec1002d08', '2025-03-01T16:45:26.778325+00:00', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '2025-02-25T08:31:27.363082+00:00', '2025-02-25T08:31:27.363082+00:00');
