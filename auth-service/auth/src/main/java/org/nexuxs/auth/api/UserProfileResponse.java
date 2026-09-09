package org.nexuxs.auth.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private String id;
    private String username;
    private String firstName;
    private String lastName;
    private String name;
    private String email;
    private List<String> roles;
    private Long createdTimestamp;
}
