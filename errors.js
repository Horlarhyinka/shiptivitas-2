
    export const messageObj ={ invalid_field_type: (field_name, type)=>({
        message: `invalid ${field_name}`,
        long_message: `${field_name} can only be ${type}`
    })

}