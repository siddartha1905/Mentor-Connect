-- ==============================================================================
-- MENTOR CONNECT — STAGE 2 SEED DATA (7 CSE-DATA SCIENCE 2ND-YEAR STUDENTS)
-- Target: Supabase PostgreSQL (Fresh & Clean Project)
-- Date: 2026-10-25
-- ==============================================================================

DO $$
DECLARE
    v_s1 UUID := gen_random_uuid();
    v_s2 UUID := gen_random_uuid();
    v_s3 UUID := gen_random_uuid();
    v_s4 UUID := gen_random_uuid();
    v_s5 UUID := gen_random_uuid();
    v_s6 UUID := gen_random_uuid();
    v_s7 UUID := gen_random_uuid();

    v_sub_dms UUID;
    v_sub_dsa UUID;
    v_sub_python UUID;
    v_sub_coa UUID;
    v_sub_dbms UUID;
    v_sub_lab UUID;
BEGIN
    -- 1. Get Subject IDs
    SELECT id INTO v_sub_dms FROM public.subjects WHERE code = 'CS2101' LIMIT 1;
    SELECT id INTO v_sub_dsa FROM public.subjects WHERE code = 'CS2102' LIMIT 1;
    SELECT id INTO v_sub_python FROM public.subjects WHERE code = 'DS2101' LIMIT 1;
    SELECT id INTO v_sub_coa FROM public.subjects WHERE code = 'CS2104' LIMIT 1;
    SELECT id INTO v_sub_dbms FROM public.subjects WHERE code = 'CS2105' LIMIT 1;
    SELECT id INTO v_sub_lab FROM public.subjects WHERE code = 'DS2102' LIMIT 1;

    -- 2. Insert Students
    INSERT INTO public.students (id, roll_number, name, email, department, year, semester, section, status, avatar_url, share_phone_in_directory, share_email_in_directory)
    VALUES
        (v_s1, '23L31A5401', 'Aarav Sharma', 'aarav.23l31a5401@viit.ac.in', 'CSE-Data Science', 2, 1, 'A', 'Active', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', true, true),
        (v_s2, '23L31A5402', 'Bhavya Reddy', 'bhavya.23l31a5402@viit.ac.in', 'CSE-Data Science', 2, 1, 'A', 'Active', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80', false, true),
        (v_s3, '23L31A5403', 'Charith Varma', 'charith.23l31a5403@viit.ac.in', 'CSE-Data Science', 2, 1, 'A', 'Active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80', false, false),
        (v_s4, '23L31A5404', 'Divya Sri', 'divya.23l31a5404@viit.ac.in', 'CSE-Data Science', 2, 1, 'A', 'Active', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80', true, false),
        (v_s5, '23L31A5405', 'Eswar Kumar', 'eswar.23l31a5405@viit.ac.in', 'CSE-Data Science', 2, 1, 'A', 'Active', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80', false, false),
        (v_s6, '23L31A5406', 'Fathima Begum', 'fathima.23l31a5406@viit.ac.in', 'CSE-Data Science', 2, 1, 'A', 'Active', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80', true, true),
        (v_s7, '23L31A5407', 'Gautam Krishna', 'gautam.23l31a5407@viit.ac.in', 'CSE-Data Science', 2, 1, 'A', 'Active', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80', false, true)
    ON CONFLICT (roll_number) DO NOTHING;

    -- 3. Insert Personal Details
    INSERT INTO public.student_personal_details (student_id, dob, gender, blood_group, phone, emergency_contact, current_address, permanent_address)
    VALUES
        (v_s1, '2005-04-12', 'Male', 'O+', '+91 98480 12345', '+91 94401 23456 (Father)', 'Plot 42, Sector 5, MVP Colony, Visakhapatnam', 'Plot 42, Sector 5, MVP Colony, Visakhapatnam'),
        (v_s2, '2005-08-21', 'Female', 'B+', '+91 97012 34567', '+91 98492 34567 (Father)', 'VIIT Campus Girls Hostel, Block B, Room 204', 'H.No 12-4-56, Ram Nagar, Anakapalle, AP'),
        (v_s3, '2005-01-15', 'Male', 'A+', '+91 99887 65432', '+91 98480 76543 (Father)', 'Flat 302, Sri Sai Nilayam, Gajuwaka, Visakhapatnam', 'Flat 302, Sri Sai Nilayam, Gajuwaka, Visakhapatnam'),
        (v_s4, '2005-11-03', 'Female', 'AB+', '+91 91234 56789', '+91 94400 56789 (Mother)', 'VIIT Girls Hostel, Block A, Room 102', 'D.No 4-12, Main Road, Tuni, AP'),
        (v_s5, '2004-12-28', 'Male', 'O-', '+91 96543 21098', '+91 99888 21098 (Brother)', 'Room 12, Friends PG, Kurmannapalem, Visakhapatnam', 'Near Old Bus Stand, Narsipatnam, AP'),
        (v_s6, '2005-06-19', 'Female', 'A-', '+91 98765 43210', '+91 98481 43210 (Father)', 'D.No 45-2-10, Jagadamba Junction, Visakhapatnam', 'D.No 45-2-10, Jagadamba Junction, Visakhapatnam'),
        (v_s7, '2005-03-30', 'Male', 'B-', '+91 94411 22334', '+91 94411 99887 (Father)', 'VIIT Boys Hostel, Block C, Room 310', 'Opposite RTC Complex, Srikakulam, AP')
    ON CONFLICT (student_id) DO NOTHING;

    -- 4. Insert Family Details
    INSERT INTO public.student_family_details (student_id, father_name, father_occupation, father_phone, mother_name, mother_occupation, mother_phone, annual_income)
    VALUES
        (v_s1, 'Rajesh Sharma', 'Executive Engineer, APSEB', '+91 94401 23456', 'Sunita Sharma', 'Senior Teacher, Kendriya Vidyalaya', '+91 94401 23457', 850000),
        (v_s2, 'Venkateswara Reddy', 'Senior Agricultural Officer', '+91 98492 34567', 'Lakshmi Reddy', 'Home Maker', '+91 98492 34568', 650000),
        (v_s3, 'Satyanarayana Varma', 'Businessman (Logistics)', '+91 98480 76543', 'Rama Devi', 'Home Maker', '+91 98480 76544', 920000),
        (v_s4, 'Srinivasa Rao', 'Lecturer in Mathematics', '+91 94400 56789', 'Kalyani', 'Accountant', '+91 94400 56790', 480000),
        (v_s5, 'Appala Naidu', 'Farmer / Small Business', '+91 99888 21098', 'Parvathi', 'Home Maker', '+91 99888 21099', 240000),
        (v_s6, 'Abdul Razak', 'Pharmacist', '+91 98481 43210', 'Shabana Begum', 'Tailor / Home Maker', '+91 98481 43211', 360000),
        (v_s7, 'Govinda Rao', 'Government Employee (APSRTC)', '+91 94411 99887', 'Padmavati', 'Anganwadi Worker', '+91 94411 99888', 320000)
    ON CONFLICT (student_id) DO NOTHING;

    -- 5. Insert Education Details
    INSERT INTO public.student_education_details (student_id, tenth_board, tenth_school, tenth_percentage, twelfth_board, twelfth_college, twelfth_percentage, eamcet_rank)
    VALUES
        (v_s1, 'CBSE', 'Kendriya Vidyalaya Steel Plant', 92.4, 'BIEAP', 'Narayana Junior College, Visakhapatnam', 94.8, 4820),
        (v_s2, 'AP SSC', 'St. Anns High School, Anakapalle', 95.0, 'BIEAP', 'Sri Chaitanya Junior College, Vizag', 96.2, 3410),
        (v_s3, 'ICSE', 'Timpany School, Visakhapatnam', 88.5, 'CBSE', 'Delhi Public School, Visakhapatnam', 89.2, 8750),
        (v_s4, 'AP SSC', 'Zilla Parishad High School, Tuni', 93.8, 'BIEAP', 'Narayana Junior College, Kakinada', 92.0, 6120),
        (v_s5, 'AP SSC', 'Govt High School, Narsipatnam', 86.4, 'BIEAP', 'Govt Junior College, Narsipatnam', 84.5, 14200),
        (v_s6, 'AP SSC', 'Queen Mary High School, Vizag', 91.2, 'BIEAP', 'Sri Chaitanya Junior College, Vizag', 90.5, 7640),
        (v_s7, 'AP SSC', 'Municipal High School, Srikakulam', 89.0, 'BIEAP', 'Tirumala Junior College, Vizianagaram', 88.2, 9890)
    ON CONFLICT (student_id) DO NOTHING;

    -- 6. Insert Academic Marks (if subjects exist)
    IF v_sub_dms IS NOT NULL THEN
        INSERT INTO public.student_subject_marks (student_id, subject_id, weekly_test_1, weekly_test_2, weekly_test_3, weekly_test_4, mid_1, mid_2, attendance_percentage, grade)
        VALUES
            (v_s1, v_sub_dms, 4.5, 4.0, 5.0, 4.0, 27, 26, 92.0, 'A+'),
            (v_s2, v_sub_dms, 5.0, 4.5, 4.5, 5.0, 28, 29, 94.5, 'O'),
            (v_s3, v_sub_dms, 3.5, 3.0, 3.5, 4.0, 21, 22, 78.0, 'B+'),
            (v_s4, v_sub_dms, 4.0, 4.5, 4.0, 4.5, 25, 26, 88.0, 'A'),
            (v_s5, v_sub_dms, 3.0, 2.5, 3.0, 3.5, 18, 19, 74.5, 'B'),
            (v_s6, v_sub_dms, 4.5, 4.5, 4.0, 4.5, 26, 27, 91.0, 'A+'),
            (v_s7, v_sub_dms, 3.5, 4.0, 3.5, 3.5, 22, 23, 82.0, 'B+')
        ON CONFLICT (student_id, subject_id) DO NOTHING;
    END IF;

    -- 7. Insert Sample Pending Submissions (For Approval Centre testing)
    INSERT INTO public.profile_submissions (student_id, section, proposed_changes, current_snapshot, status, mentor_remarks)
    VALUES
        (
            v_s2,
            'personal',
            jsonb_build_object(
                'phone', '+91 97012 99999',
                'emergency_contact', '+91 98492 34567 (Father Updated)',
                'current_address', 'VIIT Campus Girls Hostel, Block B, Room 301'
            ),
            jsonb_build_object(
                'phone', '+91 97012 34567',
                'emergency_contact', '+91 98492 34567 (Father)',
                'current_address', 'VIIT Campus Girls Hostel, Block B, Room 204'
            ),
            'Pending',
            'Room changed after hostel reallocation'
        ),
        (
            v_s3,
            'family',
            jsonb_build_object(
                'annual_income', 980000,
                'father_phone', '+91 98480 88888'
            ),
            jsonb_build_object(
                'annual_income', 920000,
                'father_phone', '+91 98480 76543'
            ),
            'Pending',
            'Updated father contact number and latest income certificate'
        )
    ON CONFLICT DO NOTHING;

END $$;
