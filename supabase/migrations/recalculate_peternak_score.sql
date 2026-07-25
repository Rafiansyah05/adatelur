CREATE OR REPLACE FUNCTION recalculate_peternak_score(p_peternak_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_omzet NUMERIC(14,2) := 0;
    v_transaction_score NUMERIC(5,2) := 0;
    
    v_total_deliveries INT := 0;
    v_on_time_deliveries INT := 0;
    v_delivery_accuracy NUMERIC(5,2) := 100;
    
    v_avg_rating NUMERIC(3,2) := 5.00;
    v_rating_score NUMERIC(5,2) := 100;
    
    v_final_score NUMERIC(5,2) := 0;
    v_is_suspended BOOLEAN := false;
BEGIN
    -- 1. Hitung Total Omzet (dari pesanan completed)
    SELECT COALESCE(SUM(subtotal), 0) INTO v_total_omzet
    FROM orders
    WHERE peternak_id = p_peternak_id AND order_status = 'completed';
    
    -- transaction_score: 100 jika omzet >= Rp 5.000.000, else proporsional
    IF v_total_omzet >= 5000000 THEN
        v_transaction_score := 100;
    ELSE
        v_transaction_score := (v_total_omzet / 5000000.0) * 100;
    END IF;
    
    -- 2. Hitung Delivery Accuracy
    SELECT COUNT(*) INTO v_total_deliveries
    FROM orders
    WHERE peternak_id = p_peternak_id AND fulfillment_method = 'delivery' AND order_status = 'completed';
    
    IF v_total_deliveries > 0 THEN
        SELECT COUNT(*) INTO v_on_time_deliveries
        FROM orders o
        JOIN delivery_proof dp ON dp.order_id = o.id
        WHERE o.peternak_id = p_peternak_id AND o.fulfillment_method = 'delivery' AND o.order_status = 'completed'
          AND dp.is_within_slot = true;
          
        v_delivery_accuracy := (v_on_time_deliveries::NUMERIC / v_total_deliveries::NUMERIC) * 100;
    ELSE
        v_delivery_accuracy := 100; -- Default jika belum ada pengiriman
    END IF;
    
    -- 3. Hitung Rating
    SELECT COALESCE(AVG(rating_value), 5.00) INTO v_avg_rating
    FROM ratings
    WHERE peternak_id = p_peternak_id;
    
    v_rating_score := (v_avg_rating / 5.0) * 100;
    
    -- 4. Hitung Final Score
    v_final_score := (v_transaction_score * 0.5) + (v_delivery_accuracy * 0.3) + (v_rating_score * 0.2);
    
    -- Threshold suspend
    IF v_final_score < 30 THEN
        v_is_suspended := true;
    END IF;
    
    -- Upsert ke peternak_scores
    INSERT INTO peternak_scores (
        peternak_id, 
        total_transaction_value, 
        transaction_score, 
        delivery_accuracy_pct, 
        delivery_score, 
        average_rating, 
        rating_score, 
        final_score, 
        is_suspended, 
        updated_at
    ) VALUES (
        p_peternak_id, 
        v_total_omzet, 
        v_transaction_score, 
        v_delivery_accuracy, 
        v_delivery_accuracy, 
        v_avg_rating, 
        v_rating_score, 
        v_final_score, 
        v_is_suspended, 
        now()
    )
    ON CONFLICT (peternak_id) DO UPDATE SET
        total_transaction_value = EXCLUDED.total_transaction_value,
        transaction_score = EXCLUDED.transaction_score,
        delivery_accuracy_pct = EXCLUDED.delivery_accuracy_pct,
        delivery_score = EXCLUDED.delivery_score,
        average_rating = EXCLUDED.average_rating,
        rating_score = EXCLUDED.rating_score,
        final_score = EXCLUDED.final_score,
        is_suspended = CASE WHEN EXCLUDED.final_score < 30 THEN true ELSE false END,
        updated_at = now();

END;
$$;
