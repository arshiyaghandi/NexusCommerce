package org.nexuxs.inventory.data.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Table("t_inventory")
@Getter @Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Inventory {

    @Id
    private Long id;
    private String skuCode;
    private Integer quantity;
}
