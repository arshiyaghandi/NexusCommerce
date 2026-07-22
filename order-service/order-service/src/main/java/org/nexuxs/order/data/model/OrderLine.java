package org.nexuxs.order.data.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;

@Table("order_lines")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderLine {

    @Id
    private Long id;
    private Long orderId;
    private Long productId;
    private int quantity;
    private BigDecimal unitPrice;
}
