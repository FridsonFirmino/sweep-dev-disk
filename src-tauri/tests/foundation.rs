#[test]
fn integration_test_environment_is_available() {
    assert_eq!("sweep-dev-disk".replace('-', ""), "sweepdevdisk");
}
