import unittest

from app.builds.matcher import find_build_ideas


class BuildMatcherTests(unittest.TestCase):
    def test_returns_phone_stand_as_full_match(self) -> None:
        inventory = {
            "red_2x4_brick": 12,
            "green_1x4_plate": 4,
            "gray_2x2_plate": 2,
        }

        result = find_build_ideas(inventory, category="objects")

        self.assertEqual(result["build_ideas"][0].build_id, "object-phone-stand")
        self.assertEqual(result["build_ideas"][0].compatibility_score, 1.0)

    def test_partial_match_reports_missing_families(self) -> None:
        inventory = {
            "red_2x4_brick": 4,
            "black_1x2_plate": 2,
            "gray_slope_2x2": 1,
        }

        result = find_build_ideas(inventory, category="buildings")
        first_build_idea = result["build_ideas"][0]

        self.assertEqual(first_build_idea.build_id, "building-micro-house")
        self.assertLess(first_build_idea.compatibility_score, 1.0)
        self.assertTrue(first_build_idea.missing_families)


if __name__ == "__main__":
    unittest.main()
